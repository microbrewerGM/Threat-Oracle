from flask import Flask, jsonify
import yaml
import os

app = Flask(__name__)

# Load YAML files
def load_yaml(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return yaml.safe_load(file)

@app.route('/api/threat-models', methods=['GET'])
def get_threat_models():
    # Load the threat model YAML files
    models = {}
    for filename in os.listdir('models'):
        if filename.endswith('.yaml'):
            model_data = load_yaml(os.path.join('models', filename))
            models[filename.replace('.yaml', '')] = model_data  # Remove .yaml extension
    return jsonify(models)

@app.route('/api/model-names', methods=['GET'])
def get_model_names():
    # List all YAML files in the models directory
    model_files = [f for f in os.listdir('models') if f.endswith('.yaml')]
    return jsonify(model_files)

if __name__ == '__main__':
    app.run(debug=True) 