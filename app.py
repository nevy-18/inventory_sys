from flask import Flask, render_template
from flask_scss import Scss
from flask_sqlalchemy import SQLAlchemy
from flask_fontawesome import FontAwesome

app = Flask(__name__)

Scss(app)
FontAwesome(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///inventory.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    stock = db.Column(db.Integer, default=0)
    price = db.Column(db.Float, default=0.0)

sample_products = [
    {'id': 1, 'name': 'Widget A', 'category': 'Electronics', 'stock': 150, 'price': 29.99},
    {'id': 2, 'name': 'Gadget B', 'category': 'Tools', 'stock': 75, 'price': 49.99},
    {'id': 3, 'name': 'Tool C', 'category': 'Hardware', 'stock': 200, 'price': 19.99}
]

@app.route("/")
def home():
    return render_template("index.html", products=sample_products)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    
    app.run(debug=True)