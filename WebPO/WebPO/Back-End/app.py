from flask import Flask, request, jsonify 
from pulp import LpProblem, LpMaximize, LpMinimize, LpVariable, lpSum, PULP_CBC_CMD
from flask_cors import CORS
from itertools import combinations
import numpy as np

app = Flask(__name__)
CORS(app) 



@app.route('/optimize', methods=['POST'])

def optimize():
    data = request.json
    print(data)
    

    objective_type = data.get('objective_type', 'maximize')  
    variables = data.get('variables', [])
    constraints = data.get('constraints', [])
    objective_function = data.get('objective_function', [])
    
    
    for constraint in constraints:
        if not isinstance(constraint['expression'], list):
            return jsonify({"error": "A expressão de restrição deve ser uma lista."}), 400
        
    for expr in constraint['expression']:
    
     if not isinstance(expr, dict) or 'var' not in expr or 'coef' not in expr:
        return jsonify({"error": "Cada item da expressão deve ser um dicionário com as chaves 'var' e 'coef'."}), 400
    
    
     if not isinstance(expr['var'], str) or not isinstance(expr['coef'], (int, float)):
        return jsonify({"error": "O valor de 'var' deve ser uma string (variável) e 'coef' um número (coeficiente)."}), 400

    
    
    prob = LpProblem("Optimization", LpMaximize if objective_type == 'maximize' else LpMinimize)

    
    decision_vars = {var['name']: LpVariable(var['name'], var.get('low_bound', 0), var.get('up_bound', None)) for var in variables}

    
    prob += lpSum([coef * decision_vars[var] for var, coef in objective_function])

    
    for constraint in constraints:
        print(constraint['expression'])
        print(constraint['type'])
        print(constraint['value'])
    
        expr = lpSum([expr_item['coef'] * decision_vars[expr_item['var']] for expr_item in constraint['expression']])

    
        if constraint['type'] == 'LE':
            prob += expr <= constraint['value']
        elif constraint['type'] == 'GE':
            prob += expr >= constraint['value']
        elif constraint['type'] == 'EQ':
             prob += expr == constraint['value']

    
    prob.solve(PULP_CBC_CMD(msg=False))
    
    
    result = {
        "status": str(prob.status),
        "objective_value": prob.objective.value(),
        "variables": {var.name: var.value() for var in prob.variables()},
     
    }

    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)