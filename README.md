# Shopping Bill Calculator

A comprehensive shopping bill calculator application with both frontend and backend components. Manage your shopping bills efficiently with full CRUD operations.

## Features

✨ **Bill Management**
- Create new bills with bill number and customer name
- View all bills in a card-based interface
- Edit bill customer information
- Delete bills (with items automatically removed)
- View detailed bill breakdown

📝 **Item Management**
- Add multiple items to each bill
- Edit item quantity and price
- Delete individual items
- Automatic subtotal calculation
- Real-time bill total updates

💰 **Financial Features**
- Automatic calculation of subtotals
- Real-time bill total computation
- Detailed pricing breakdown
- Print bills for records

🎨 **User Interface**
- Responsive design (works on desktop, tablet, mobile)
- Modern and intuitive interface
- Real-time notifications
- Smooth animations and transitions
- Print-friendly layout

## Project Structure

```
Shopping-bill-calculators/
├── backend/
│   ├── app.py              # Flask backend application
│   ├── requirements.txt    # Python dependencies
│   └── bills.db           # SQLite database (auto-created)
│
└── frontend/
    ├── index.html         # Main HTML file
    ├── styles.css         # CSS styling
    └── script.js          # JavaScript functionality
```

## Technology Stack

### Backend
- **Framework**: Flask 2.3.3
- **Language**: Python 3.7+
- **Database**: SQLite
- **CORS**: Flask-CORS for cross-origin requests

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Vanilla JS (no frameworks)

## Installation & Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask application:**
   ```bash
   python app.py
   ```
   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Open in a web browser:**
   - Simply open `index.html` in your web browser, OR
   - Use a local server (recommended):
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Then open: http://localhost:8000
     ```

## API Endpoints

### Bills

#### GET /api/bills
Get all bills
```bash
curl http://localhost:5000/api/bills
```

#### GET /api/bills/<bill_id>
Get a specific bill with its items
```bash
curl http://localhost:5000/api/bills/1
```

#### POST /api/bills
Create a new bill
```bash
curl -X POST http://localhost:5000/api/bills \
  -H "Content-Type: application/json" \
  -d '{"bill_number": "BILL-001", "customer_name": "John Doe"}'
```

#### PUT /api/bills/<bill_id>
Update a bill
```bash
curl -X PUT http://localhost:5000/api/bills/1 \
  -H "Content-Type: application/json" \
  -d '{"customer_name": "Jane Doe"}'
```

#### DELETE /api/bills/<bill_id>
Delete a bill
```bash
curl -X DELETE http://localhost:5000/api/bills/1
```

### Items

#### POST /api/bills/<bill_id>/items
Add an item to a bill
```bash
curl -X POST http://localhost:5000/api/bills/1/items \
  -H "Content-Type: application/json" \
  -d '{"item_name": "Apple", "quantity": 5, "unit_price": 2.50}'
```

#### PUT /api/items/<item_id>
Update an item
```bash
curl -X PUT http://localhost:5000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"item_name": "Apple", "quantity": 10, "unit_price": 2.00}'
```

#### DELETE /api/items/<item_id>
Delete an item
```bash
curl -X DELETE http://localhost:5000/api/items/1
```

### Utilities

#### GET /api/bills/<bill_id>/total
Get the total amount of a bill
```bash
curl http://localhost:5000/api/bills/1/total
```

#### GET /api/health
Health check endpoint
```bash
curl http://localhost:5000/api/health
```

## Usage Guide

### Creating a Bill

1. Click on the **"+ New Bill"** button
2. Enter a unique bill number (e.g., BILL-001)
3. Enter the customer name
4. Click **"Create Bill"**

### Adding Items to a Bill

1. Click on a bill card to view its details
2. In the "Add Item to Bill" form:
   - Enter item name (e.g., Apple, Milk)
   - Enter quantity
   - Enter unit price
3. Click **"Add Item"**
4. The bill total will automatically update

### Editing Items

1. Click the **"Edit"** button on an item
2. Enter the new quantity and price when prompted
3. The bill total will automatically recalculate

### Deleting Items

1. Click the **"Delete"** button on an item
2. Confirm the deletion
3. The bill total will automatically update

### Editing Bills

1. Click the **"Edit Bill"** button in the Bill Summary section
2. Modify the customer name
3. Click **"Update Bill"**

### Deleting Bills

1. Click the **"Delete Bill"** button in the Bill Summary section
2. Confirm the deletion (this will also delete all items)

### Printing Bills

1. Click the **"Print Bill"** button
2. Use your browser's print dialog to save or print the bill

## Database Schema

### Bills Table
```sql
CREATE TABLE bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    total_amount REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Items Table
```sql
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
```

## Error Handling

The application handles various error scenarios:
- Missing required fields
- Duplicate bill numbers
- Invalid quantities or prices
- Database connection errors
- Network errors (for API calls)

All errors are displayed as user-friendly notifications.

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11: Not supported

## Tips & Best Practices

1. **Bill Numbers**: Use a consistent format (e.g., BILL-001, BILL-002)
2. **Quantities**: Support decimal values for items sold by weight (e.g., 0.5 kg)
3. **Prices**: Enter prices in your local currency
4. **Backups**: The database is stored locally; consider backing it up regularly
5. **Print Records**: Use the print feature to keep paper records

## Troubleshooting

### Backend won't start
- Ensure Python 3.7+ is installed
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify port 5000 is not in use

### Frontend not connecting to API
- Ensure the backend is running on `http://localhost:5000`
- Check browser console for CORS errors
- Verify the API_BASE_URL in `script.js` is correct

### Database errors
- Delete `bills.db` to reset the database
- Ensure the backend directory has write permissions

## Future Enhancements

- User authentication and authorization
- Multiple user accounts
- Bill search and filtering
- Export to PDF
- Invoice templates
- Tax calculations
- Discount options
- Payment methods tracking
- Bill history and analytics

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## Support

For issues or questions, please open an issue in the repository.

---

**Happy Bill Calculating!** 🛒💰
