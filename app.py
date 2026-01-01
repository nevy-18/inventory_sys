from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_fontawesome import FontAwesome
from sqlalchemy import func
from datetime import datetime
from sorting import shell_sort, merge_sort, adrenaline_hybrid_sort

app = Flask(__name__)
fa = FontAwesome(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///inventory.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

app_settings = {"threshold": 5}

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

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(100), nullable=False)
    size = db.Column(db.String(20))
    quantity = db.Column(db.Integer, nullable=False)
    customer_name = db.Column(db.String(100))
    assigned_seller = db.Column(db.String(100))
    date_posted = db.Column(db.DateTime, default=datetime.utcnow)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_content/<section>")
def get_content(section):
    t = app_settings["threshold"]
    if section == "dashboard":
        total = Product.query.count()
        val = db.session.query(func.sum(Product.price * Product.stock)).scalar() or 0
        low = Product.query.filter(Product.stock <= t).count()
        return render_template("sections/dashboard.html", total=total, value=val, low_stock=low, threshold=t)
    elif section == "products":
        products = Product.query.all()
        return render_template("sections/products.html", products=products, threshold=t)
    elif section == "suppliers":
        return render_template("sections/suppliers.html")
    elif section == "orders":
        orders = Order.query.order_by(Order.date_posted.desc()).all()
        products = Product.query.all()
        return render_template("sections/orders.html", orders=orders, products=products)
    elif section == "reports":
        raw_products = Product.query.all()
        sales = Sale.query.order_by(Sale.date_sold.desc()).all()
        hybrid_sorted = adrenaline_hybrid_sort(raw_products, 'category', 'stock')
        return render_template("sections/reports.html", products=hybrid_sorted, sales=sales, threshold=t)
    elif section == "settings":
        return render_template("sections/settings.html", threshold=t)
    return "Not Found", 404

@app.route("/add_product", methods=["POST"])
def add_product():
    fd = request.form
    name, size = fd.get("name"), fd.get("size", "N/A")
    p = Product.query.filter_by(name=name, size=size).first()
    if p:
        p.stock += int(fd.get("stock"))
    else:
        db.session.add(Product(name=name, category=fd.get("category"), size=size,
                               stock=int(fd.get("stock")), price=float(fd.get("price"))))
    db.session.commit()
    return jsonify({"success": True})

@app.route("/post_order", methods=["POST"])
def post_order():
    fd = request.form
    new_order = Order(product_name=fd.get("name"), size=fd.get("size", "N/A"),
                      quantity=int(fd.get("quantity")), customer_name=fd.get("customer_name"),
                      assigned_seller=fd.get("assigned_seller"))
    db.session.add(new_order)
    db.session.commit()
    return jsonify({"success": True})

@app.route("/complete_order/<int:order_id>", methods=["POST"])
def complete_order(order_id):
    order = Order.query.get_or_404(order_id)
    product = Product.query.filter_by(name=order.product_name, size=order.size).first()
    if product and product.stock >= order.quantity:
        product.stock -= order.quantity
        new_sale = Sale(product_name=order.product_name, size=order.size, quantity=order.quantity,
                        total_price=product.price * order.quantity, assigned_to=order.assigned_seller)
        db.session.add(new_sale)
        db.session.delete(order)
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Insufficient stock"})

@app.route("/sell_product/<int:product_id>", methods=["POST"])
def sell_product(product_id):
    p = Product.query.get_or_404(product_id)
    qty = int(request.form.get("quantity", 1))
    seller = request.form.get("assigned_to", "Unknown")
    if p.stock >= qty:
        p.stock -= qty
        db.session.add(Sale(product_name=p.name, size=p.size, quantity=qty,
                        total_price=p.price * qty, assigned_to=seller))
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Insufficient stock"})

@app.route("/check_stock", methods=["POST"])
def check_stock():
    p = Product.query.filter_by(name=request.form.get("name"), size=request.form.get("size", "N/A")).first()
    if p:
        return jsonify({"success": True, "stock": p.stock, "product_id": p.id})
    return jsonify({"success": False})

@app.route("/update_settings", methods=["POST"])
def update_settings():
    app_settings["threshold"] = int(request.form.get("threshold", 5))
    return jsonify({"success": True})

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)