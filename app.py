from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# 1. CORS CONFIGURADO PARA DESARROLLO (Acepta todo)
CORS(app, resources={r"/*": {"origins": "*"}})

# 2. CONEXIÓN CON VALIDACIÓN DE ERRORES Y PARÁMETRO TLS CORREGIDO
try:
    mongo_uri = os.getenv("MONGO_URI")
    # serverSelectionTimeoutMS evita bloqueos largos si la clave está mal
    # tlsAllowInvalidCertificates previene los errores de handshake SSL/TLS en Render
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
    db = client["tienda"]
    productos_col = db["productos"]
    usuarios_col = db["usuarios"]
    
    # Intentar un comando simple para confirmar conexión
    client.admin.command('ping')
    print("✅ ¡Conexión exitosa a MongoDB Atlas!")
except Exception as e:
    print(f"❌ ERROR DE CONEXIÓN A MONGO: {e}")

# 3. RUTA RAÍZ (Para evitar el error 404 en la URL principal)
@app.route("/", methods=["GET"])
def home():
    return jsonify({"mensaje": "Backend de ShopSystem corriendo perfectamente en Render"}), 200

# 4. RUTAS DE PRODUCTOS
@app.route("/productos", methods=["GET"])
def get_all():
    try:
        res = []
        for p in productos_col.find():
            p["_id"] = str(p["_id"])
            res.append(p)
        return jsonify(res), 200
    except Exception as e:
        print(f"Error en GET: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/productos", methods=["POST"])
def create():
    try:
        data = request.json
        if not data.get("nombre") or not data.get("precio"):
            return jsonify({"error": "Faltan campos"}), 400
        
        nuevo_id = productos_col.insert_one(data).inserted_id
        return jsonify({"mensaje": "Creado", "id": str(nuevo_id)}), 201
    except Exception as e:
        print(f"Error en POST: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/productos/<id>", methods=["DELETE"])
def delete(id):
    try:
        productos_col.delete_one({"_id": ObjectId(id)})
        return jsonify({"mensaje": "Eliminado"}), 200
    except Exception as e:
        return jsonify({"error": "ID inválido"}), 400

@app.route("/productos/<id>", methods=["PUT"])
def update(id):
    try:
        data = request.json
        productos_col.update_one({"_id": ObjectId(id)}, {"$set": data})
        return jsonify({"mensaje": "Actualizado"}), 200
    except Exception as e:
        return jsonify({"error": "Error al actualizar"}), 400

# 5. RUTAS DE AUTENTICACIÓN
@app.route("/registro", methods=["POST"])
def registro():
    try:
        data = request.json
        if not data.get("usuario") or not data.get("password"):
            return jsonify({"error": "Faltan campos obligatorios"}), 400
            
        if usuarios_col.find_one({"usuario": data['usuario']}):
            return jsonify({"error": "El usuario ya existe"}), 400
        
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
