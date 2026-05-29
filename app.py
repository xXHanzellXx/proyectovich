from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# 1. CORS CONFIGURADO PARA PRODUCCIÓN
CORS(app, resources={r"/*": {
    "origins": "*", 
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# 2. CONEXIÓN CON VALIDACIÓN DE ERRORES
try:
    mongo_uri = os.getenv("MONGO_URI")
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
    db = client["tienda"]
    productos_col = db["productos"]
    usuarios_col = db["usuarios"]
    
    client.admin.command('ping')
    print("✅ ¡Conexión exitosa a MongoDB Atlas!")
except Exception as e:
    print(f"❌ ERROR DE CONEXIÓN A MONGO: {e}")

@app.before_request
def handle_options_requests():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

# 3. RUTA RAÍZ
@app.route("/", methods=["GET"])
def home():
    return jsonify({"mensaje": "Backend de ShopSystem corriendo perfectamente en Render"}), 200

# 4. RUTAS DE PRODUCTOS (CON SOPORTE PARA STOCK)
@app.route("/productos", methods=["GET"])
def get_all():
    try:
        res = []
        for p in productos_col.find():
            p["_id"] = str(p["_id"])
            # Si el producto en la BD no tiene stock, le aseguramos un valor numérico por defecto
            if "stock" not in p:
                p["stock"] = 10
            res.append(p)
        return jsonify(res), 200
    except Exception as e:
        print(f"Error en GET: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/productos", methods=["POST"])
def create():
    try:
        data = request.json
        if not data.get("nombre") or data.get("precio") is None:
            return jsonify({"error": "Faltan campos obligatorios"}), 400
        
        # Estructuramos el payload limpiamente asegurando tipos de datos correctos
        nuevo_producto = {
            "nombre": data.get("nombre"),
            "precio": float(data.get("precio")),
            "categoria": data.get("categoria", "General"),
            "stock": int(data.get("stock", 10)) # Forzamos que sea un entero (Int32 en MongoDB)
        }
        
        nuevo_id = productos_col.insert_one(nuevo_producto).inserted_id
        return jsonify({"mensaje": "Creado", "id": str(nuevo_id)}), 201
    except Exception as e:
        print(f"Error en POST: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/productos/<id>", methods=["PUT"])
def update(id):
    try:
        data = request.json
        
        # Construimos el diccionario de actualización de forma segura
        campos_a_actualizar = {}
        
        if "nombre" in data: campos_a_actualizar["nombre"] = data["nombre"]
        if "precio" in data: campos_a_actualizar["precio"] = float(data["precio"])
        if "categoria" in data: campos_a_actualizar["categoria"] = data["categoria"]
        if "stock" in data: campos_a_actualizar["stock"] = int(data["stock"]) # Guardamos como entero

        if not campos_a_actualizar:
            return jsonify({"error": "No hay datos válidos para actualizar"}), 400

        productos_col.update_one({"_id": ObjectId(id)}, {"$set": campos_a_actualizar})
        return jsonify({"mensaje": "Actualizado"}), 200
    except Exception as e:
        print(f"Error en PUT: {e}")
        return jsonify({"error": "Error al actualizar o ID inválido"}), 400

@app.route("/productos/<id>", methods=["DELETE"])
def delete(id):
    try:
        productos_col.delete_one({"_id": ObjectId(id)})
        return jsonify({"mensaje": "Eliminado"}), 200
    except Exception as e:
        return jsonify({"error": "ID inválido"}), 400

# 5. RUTAS DE AUTENTICACIÓN
@app.route("/registro", methods=["POST"])
def registro():
    try:
        data = request.json
        if not data.get("usuario") or not data.get("password"):
            return jsonify({"error": "Faltan campos obligatorios"}), 400
            
        if usuarios_col.find_one({"usuario": data['usuario']}):
            return jsonify({"error": "El usuario ya existe"}), 400
        
        # Asignamos rol de cliente por defecto si no viene especificado
        if "rol" not in data:
            data["rol"] = "cliente"
            
        usuarios_col.insert_one(data)
        return jsonify({"mensaje": "Usuario registrado"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        user = usuarios_col.find_one({"usuario": data['usuario'], "password": data['password']})
        if user:
            return jsonify({
                "usuario": user['usuario'],
                "rol": user.get('rol', 'cliente')
            }), 200
        return jsonify({"error": "Credenciales inválidas"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000, host='0.0.0.0')
