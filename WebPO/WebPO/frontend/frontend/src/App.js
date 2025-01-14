import React, { useState } from 'react';
import axios from 'axios';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);


const App = () => {
  const [variables, setVariables] = useState([{ name: '', low_bound: 0, up_bound: null }]);
  const [objectiveFunction, setObjectiveFunction] = useState([{ name: '', coef: 0 }]);
  const [constraints, setConstraints] = useState([
    { expression: [{ var: '', coef: 0 }], type: 'LE', value: 0 },
  ]);

  const [objectiveType, setObjectiveType] = useState('maximize');
  const [results, setResults] = useState(null);

  // Handlers para adicionar/remover inputs dinâmicos
  const addVariable = () => setVariables([...variables, { name: '', low_bound: 0, up_bound: null }]);
  const addObjectiveTerm = () => setObjectiveFunction([...objectiveFunction, { name: '', coef: 0 }]);
  const addConstraint = () => setConstraints([...constraints, { expression: [], type: 'LE', value: 0 }]);

  const handleSubmit = async () => {
    try {
      const payload = {
        objective_type: objectiveType,
        variables,
        objective_function: objectiveFunction.map((term) => [term.name, term.coef]),
        constraints: constraints.map((constraint) => ({
          expression: constraint.expression.map(term => ({
            var: term.name,
            coef: term.coef
          })),
          type: constraint.type,
          value: constraint.value,
        })),
      };

      const response = await axios.post('http://127.0.0.1:5000/optimize', payload);
      setResults(response.data);
    } catch (error) {
      console.error('Erro ao enviar os dados:', error);
    }
  };

  // Gráfico de resultados (apenas para 2D)
  const chartData = results
    ? {
        datasets: [
          {
            label: 'Região Factível',
            data: results.feasible_region || [],
            backgroundColor: 'rgba(75,192,192,0.4)',
          },
          {
            label: 'Solução Ótima',
            data: results.optimal_point ? [results.optimal_point] : [],
            backgroundColor: 'rgba(255,99,132,1)',
          },
        ],
      }
    : null;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Otimização Linear</h1>
      <h2>Definir Problema</h2>

      <div>
        <label>
          Tipo de Otimização:
          <select value={objectiveType} onChange={(e) => setObjectiveType(e.target.value)}>
            <option value="maximize">Maximizar</option>
            <option value="minimize">Minimizar</option>
          </select>
        </label>
      </div>

      <h3>Variáveis de Decisão</h3>
      {variables.map((variable, index) => (
        <div key={index}>
          <input
            type="text"
            placeholder="Nome"
            value={variable.name}
            onChange={(e) => {
              const newVars = [...variables];
              newVars[index].name = e.target.value;
              setVariables(newVars);
            }}
          />
          <input
            type="number"
            placeholder="Limite Inferior"
            value={variable.low_bound}
            onChange={(e) => {
              const newVars = [...variables];
              newVars[index].low_bound = parseFloat(e.target.value);
              setVariables(newVars);
            }}
          />
          <input
            type="number"
            placeholder="Limite Superior"
            value={variable.up_bound}
            onChange={(e) => {
              const newVars = [...variables];
              newVars[index].up_bound = e.target.value ? parseFloat(e.target.value) : null;
              setVariables(newVars);
            }}
          />
        </div>
      ))}
      <button onClick={addVariable}>Adicionar Variável</button>

      <h3>Função Objetivo</h3>
      {objectiveFunction.map((term, index) => (
        <div key={index}>
          <input
            type="text"
            placeholder="Variável"
            value={term.name}
            onChange={(e) => {
              const newTerms = [...objectiveFunction];
              newTerms[index].name = e.target.value;
              setObjectiveFunction(newTerms);
            }}
          />
          <input
            type="number"
            placeholder="Coeficiente"
            value={term.coef}
            onChange={(e) => {
              const newTerms = [...objectiveFunction];
              newTerms[index].coef = parseFloat(e.target.value);
              setObjectiveFunction(newTerms);
            }}
          />
        </div>
      ))}
      <button onClick={addObjectiveTerm}>Adicionar Termo</button>

      <h3>Restrições</h3>
      {constraints.map((constraint, index) => (
        <div key={index}>
          <div>
            {constraint.expression.map((term, i) => (
              <div key={i}>
                <input
                  type="text"
                  placeholder="Variável (ex: x1)"
                  value={term.name || ''}
                  onChange={(e) => {
                    const newConstraints = [...constraints];
                    newConstraints[index].expression[i] = {
                      ...newConstraints[index].expression[i],
                      name: e.target.value,
                    };
                    setConstraints(newConstraints);
                  }}
                />
                <input
                  type="number"
                  placeholder="Coeficiente (ex: 2)"
                  value={term.coef || ''}
                  onChange={(e) => {
                    const newConstraints = [...constraints];
                    newConstraints[index].expression[i] = {
                      ...newConstraints[index].expression[i],
                      coef: parseFloat(e.target.value),
                    };
                    setConstraints(newConstraints);
                  }}
                />
              </div>
            ))}
            <button
              onClick={() => {
                const newConstraints = [...constraints];
                newConstraints[index].expression.push({ var: '', coef: 0 });
                setConstraints(newConstraints);
              }}
            >
              Adicionar Termo à Restrição
            </button>
          </div>

          <select
            value={constraint.type}
            onChange={(e) => {
              const newConstraints = [...constraints];
              newConstraints[index].type = e.target.value;
              setConstraints(newConstraints);
            }}
          >
            <option value="LE">≤</option>
            <option value="GE">≥</option>
            <option value="EQ">=</option>
          </select>
          <input
            type="number"
            placeholder="Valor"
            value={constraint.value}
            onChange={(e) => {
              const newConstraints = [...constraints];
              newConstraints[index].value = parseFloat(e.target.value);
              setConstraints(newConstraints);
            }}
          />
        </div>
      ))}
      <button onClick={addConstraint}>Adicionar Restrição</button>

      <button onClick={handleSubmit}>Resolver</button>

      {results && (
        <div>
          <h2>Resultados</h2>
          <p>Status: {results.status}</p>
          <p>Valor da Função Objetivo: {results.objective_value}</p>
          <h3>Valores das Variáveis</h3>
          <ul>
            {Object.entries(results.variables).map(([key, value]) => (
              <li key={key}>
                {key}: {value}
              </li>
            ))}
          </ul>

          {chartData && <Scatter key={JSON.stringify(chartData)} data={chartData} />}

        </div>
      )}
    </div>
  );
};

export default App;
