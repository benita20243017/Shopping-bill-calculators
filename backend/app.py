from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Database initialization
DATABASE = 'bills.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DATABASE):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create bills table
        cursor.execute('''
            CREATE TABLE bills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bill_number TEXT UNIQUE NOT NULL,
                customer_name TEXT NOT NULL,
                total_amount REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create items table
        cursor.execute('''
            CREATE TABLE items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bill_id INTEGER NOT NULL,
                item_name TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit_price REAL NOT NULL,
                subtotal REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
            )
        ''')
        
        conn.commit()
        conn.close()

# Initialize database on startup
init_db()

# ==================== BILL CRUD OPERATIONS ====================

@app.route('/api/bills', methods=['GET'])
def get_bills():
    """Get all bills"""
    try:
        conn = get_db_connection()
        bills = conn.execute('SELECT * FROM bills ORDER BY created_at DESC').fetchall()
        conn.close()
        return jsonify([dict(bill) for bill in bills]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bills/<int:bill_id>', methods=['GET'])
def get_bill(bill_id):
    """Get a specific bill with its items"""
    try:
        conn = get_db_connection()
        bill = conn.execute('SELECT * FROM bills WHERE id = ?', (bill_id,)).fetchone()
        
        if not bill:
            conn.close()
            return jsonify({'error': 'Bill not found'}), 404
        
        items = conn.execute('SELECT * FROM items WHERE bill_id = ?', (bill_id,)).fetchall()
        conn.close()
        
        bill_data = dict(bill)
        bill_data['items'] = [dict(item) for item in items]
        return jsonify(bill_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bills', methods=['POST'])
def create_bill():
    """Create a new bill"""
    try:
        data = request.get_json()
        
        if not data.get('bill_number') or not data.get('customer_name'):
            return jsonify({'error': 'Bill number and customer name are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO bills (bill_number, customer_name)
            VALUES (?, ?)
        ''', (data['bill_number'], data['customer_name']))
        
        conn.commit()
        bill_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'id': bill_id,
            'bill_number': data['bill_number'],
            'customer_name': data['customer_name'],
            'total_amount': 0
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Bill number already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bills/<int:bill_id>', methods=['PUT'])
def update_bill(bill_id):
    """Update a bill"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if bill exists
        bill = conn.execute('SELECT * FROM bills WHERE id = ?', (bill_id,)).fetchone()
        if not bill:
            conn.close()
            return jsonify({'error': 'Bill not found'}), 404
        
        cursor.execute('''
            UPDATE bills
            SET customer_name = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (data.get('customer_name', bill['customer_name']), bill_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Bill updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bills/<int:bill_id>', methods=['DELETE'])
def delete_bill(bill_id):
    """Delete a bill and all its items"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if bill exists
        bill = conn.execute('SELECT * FROM bills WHERE id = ?', (bill_id,)).fetchone()
        if not bill:
            conn.close()
            return jsonify({'error': 'Bill not found'}), 404
        
        cursor.execute('DELETE FROM items WHERE bill_id = ?', (bill_id,))
        cursor.execute('DELETE FROM bills WHERE id = ?', (bill_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Bill deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ITEM CRUD OPERATIONS ====================

@app.route('/api/bills/<int:bill_id>/items', methods=['POST'])
def add_item(bill_id):
    """Add an item to a bill"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if bill exists
        bill = conn.execute('SELECT * FROM bills WHERE id = ?', (bill_id,)).fetchone()
        if not bill:
            conn.close()
            return jsonify({'error': 'Bill not found'}), 404
        
        if not all(k in data for k in ['item_name', 'quantity', 'unit_price']):
            conn.close()
            return jsonify({'error': 'Missing required fields'}), 400
        
        subtotal = float(data['quantity']) * float(data['unit_price'])
        
        cursor.execute('''
            INSERT INTO items (bill_id, item_name, quantity, unit_price, subtotal)
            VALUES (?, ?, ?, ?, ?)
        ''', (bill_id, data['item_name'], data['quantity'], data['unit_price'], subtotal))
        
        # Update bill total
        total = conn.execute('SELECT SUM(subtotal) FROM items WHERE bill_id = ?', (bill_id,)).fetchone()[0]
        cursor.execute('UPDATE bills SET total_amount = ? WHERE id = ?', (total or 0, bill_id))
        
        conn.commit()
        item_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'id': item_id,
            'bill_id': bill_id,
            'item_name': data['item_name'],
            'quantity': data['quantity'],
            'unit_price': data['unit_price'],
            'subtotal': subtotal
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    """Update an item"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if item exists
        item = conn.execute('SELECT * FROM items WHERE id = ?', (item_id,)).fetchone()
        if not item:
            conn.close()
            return jsonify({'error': 'Item not found'}), 404
        
        quantity = float(data.get('quantity', item['quantity']))
        unit_price = float(data.get('unit_price', item['unit_price']))
        subtotal = quantity * unit_price
        
        cursor.execute('''
            UPDATE items
            SET item_name = ?, quantity = ?, unit_price = ?, subtotal = ?
            WHERE id = ?
        ''', (data.get('item_name', item['item_name']), quantity, unit_price, subtotal, item_id))
        
        # Update bill total
        bill_id = item['bill_id']
        total = conn.execute('SELECT SUM(subtotal) FROM items WHERE bill_id = ?', (bill_id,)).fetchone()[0]
        cursor.execute('UPDATE bills SET total_amount = ? WHERE id = ?', (total or 0, bill_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Item updated successfully', 'subtotal': subtotal}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    """Delete an item from a bill"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if item exists
        item = conn.execute('SELECT * FROM items WHERE id = ?', (item_id,)).fetchone()
        if not item:
            conn.close()
            return jsonify({'error': 'Item not found'}), 404
        
        bill_id = item['bill_id']
        cursor.execute('DELETE FROM items WHERE id = ?', (item_id,))
        
        # Update bill total
        total = conn.execute('SELECT SUM(subtotal) FROM items WHERE bill_id = ?', (bill_id,)).fetchone()[0]
        cursor.execute('UPDATE bills SET total_amount = ? WHERE id = ?', (total or 0, bill_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Item deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== UTILITY ENDPOINTS ====================

@app.route('/api/bills/<int:bill_id>/total', methods=['GET'])
def get_bill_total(bill_id):
    """Get the total amount of a bill"""
    try:
        conn = get_db_connection()
        bill = conn.execute('SELECT total_amount FROM bills WHERE id = ?', (bill_id,)).fetchone()
        conn.close()
        
        if not bill:
            return jsonify({'error': 'Bill not found'}), 404
        
        return jsonify({'bill_id': bill_id, 'total_amount': bill['total_amount']}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'API is running'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
