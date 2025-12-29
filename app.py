from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_fontawesome import FontAwesome
from sqlalchemy import func
from datetime import datetime
from sorting import shell_sort, merge_sort

app = Flask(__name__)
fa = FontAwesome(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///inventory.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    size = db.Column(db.String(20), default="N/A")
    stock = db.Column(db.Integer, default=0)
    price = db.Column(db.Float, nullable=False)

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(100), nullable=False)
    size = db.Column(db.String(20))
    quantity = db.Column(db.Integer, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    assigned_to = db.Column(db.String(100), nullable=False)
    date_sold = db.Column(db.DateTime, default=datetime.utcnow)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_content/<section>")
def get_content(section):
    if section == "dashboard":
        total = Product.query.count()
        val = db.session.query(func.sum(Product.price * Product.stock)).scalar() or 0
        low = Product.query.filter(Product.stock < 5).count()
        return render_template("sections/dashboard.html", total=total, value=val, low_stock=low)
    elif section == "products":
        products = Product.query.all()
        return render_template("sections/products.html", products=products)
    elif section == "reports":
        products = Product.query.all()
        sales = Sale.query.order_by(Sale.date_sold.desc()).all()
        semi = shell_sort(products, 'category')
        return render_template("sections/reports.html", products=merge_sort(semi, 'stock'), sales=sales)
    return "Not Found", 404

@app.route("/add_product", methods=["POST"])
def add_product():
    name = request.form.get("name").strip()
    size = request.form.get("size", "N/A").strip()
    existing = Product.query.filter(func.lower(Product.name) == func.lower(name), 
                                    func.lower(Product.size) == func.lower(size)).first()
    if existing:
        return jsonify({"success": False, "exists": True, "name": existing.name, "size": existing.size, "stock": existing.stock})
    
    new_item = Product(name=name, category=request.form.get("category"), size=size,
                       stock=int(request.form.get("stock")), price=float(request.form.get("price")))
    db.session.add(new_item)
    db.session.commit()
    return jsonify({"success": True})

@app.route("/restock_product", methods=["POST"])
def restock_product():
    product = Product.query.filter(func.lower(Product.name) == func.lower(request.form.get("name")),
                                   func.lower(Product.size) == func.lower(request.form.get("size"))).first()
    if product:
        product.stock += int(request.form.get("stock"))
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False}), 404

@app.route("/sell_product/<int:product_id>", methods=["POST"])
def sell_product(product_id):
    product = Product.query.get_or_404(product_id)
    qty = int(request.form.get("quantity", 1))
    if product.stock >= qty:
        product.stock -= qty
        db.session.add(Sale(product_name=product.name, size=product.size, quantity=qty, 
                            total_price=product.price * qty, assigned_to=request.form.get("assignee")))
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Insufficient stock"}), 400

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)