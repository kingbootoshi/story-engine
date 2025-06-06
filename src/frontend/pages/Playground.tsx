import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../trpcClient';
import type { RouteInfo, FormField } from '../types/playground';

export function Playground() {
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      generateFormFields(selectedRoute);
    }
  }, [selectedRoute]);

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/worlds/meta');
      const data = await response.json();
      
      const routeList: RouteInfo[] = [];
      
      if (data.routes) {
        Object.entries(data.routes).forEach(([procedure, config]: [string, any]) => {
          routeList.push({
            procedure,
            type: config.type || 'query',
            module: 'worlds',
            params: config.params || {}
          });
        });
      }
      
      console.debug('[Playground] Fetched routes:', routeList);
      setRoutes(routeList);
    } catch (err) {
      console.error('[Playground] Failed to fetch routes:', err);
      setError('Failed to fetch available routes. Make sure the server is running on port 3001.');
    }
  };

  const generateFormFields = (route: RouteInfo) => {
    const fields: FormField[] = [];
    
    // Common fields based on procedure name
    if (route.procedure.includes('create')) {
      fields.push(
        { name: 'name', type: 'text', required: true, value: '' },
        { name: 'description', type: 'text', required: true, value: '' }
      );
      if (route.procedure === 'create') {
        fields.push(
          { name: 'type', type: 'text', required: true, value: 'fantasy' },
          { name: 'tone', type: 'text', required: true, value: 'whimsical' }
        );
      }
    } else if (route.procedure.includes('get') || route.procedure.includes('progress')) {
      if (route.procedure.includes('world')) {
        fields.push({ name: 'worldId', type: 'text', required: true, value: '' });
      }
      if (route.procedure.includes('arc')) {
        fields.push({ name: 'arcId', type: 'text', required: true, value: '' });
      }
    } else if (route.procedure === 'recordWorldEvent') {
      fields.push(
        { name: 'worldId', type: 'text', required: true, value: '' },
        { name: 'eventType', type: 'text', required: true, value: '' },
        { name: 'data', type: 'object', required: false, value: '{}' }
      );
    } else if (route.procedure === 'list') {
      fields.push(
        { name: 'limit', type: 'number', required: false, value: '10' },
        { name: 'offset', type: 'number', required: false, value: '0' }
      );
    }
    
    setFormFields(fields);
  };

  const updateFieldValue = (index: number, value: any) => {
    const newFields = [...formFields];
    newFields[index].value = value;
    setFormFields(newFields);
  };

  const buildInputObject = () => {
    const input: Record<string, any> = {};
    
    formFields.forEach(field => {
      if (field.value !== '' && field.value !== undefined) {
        if (field.type === 'number') {
          input[field.name] = parseInt(field.value);
        } else if (field.type === 'boolean') {
          input[field.name] = field.value === 'true';
        } else if (field.type === 'object') {
          try {
            input[field.name] = JSON.parse(field.value);
          } catch {
            input[field.name] = {};
          }
        } else {
          input[field.name] = field.value;
        }
      }
    });
    
    return input;
  };

  const executeProcedure = async () => {
    if (!selectedRoute) return;

    setIsLoading(true);
    setOutput('');
    setError('');

    try {
      const input = buildInputObject();
      console.debug('[Playground] ►', selectedRoute.procedure, { input });

      const procedurePath = selectedRoute.procedure.split('.');
      let procedureRef: any = trpc;
      
      for (const segment of procedurePath) {
        procedureRef = procedureRef[segment];
      }

      const result = selectedRoute.type === 'mutation' 
        ? await procedureRef.mutate(input)
        : await procedureRef.query(input);

      console.debug('[Playground] ►', selectedRoute.procedure, { input, out: result });
      setOutput(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('[Playground] ✗', selectedRoute.procedure, err);
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ marginBottom: '1rem', display: 'inline-block' }}>
          ← Back to Dashboard
        </Link>
        <h1>API Playground</h1>
        <p style={{ color: '#666' }}>Test your tRPC procedures with an easy-to-use interface</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', minHeight: '500px' }}>
        <div>
          <h2>Select Procedure</h2>
          <select 
            onChange={(e) => {
              const route = routes.find(r => r.procedure === e.target.value);
              setSelectedRoute(route || null);
              setOutput('');
              setError('');
            }}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              marginBottom: '1.5rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="">-- Select a procedure --</option>
            {routes.map((route) => (
              <option key={route.procedure} value={route.procedure}>
                {route.procedure} ({route.type})
              </option>
            ))}
          </select>

          {selectedRoute && (
            <>
              <h3>Parameters</h3>
              {formFields.length === 0 ? (
                <p style={{ color: '#666' }}>No parameters required</p>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); executeProcedure(); }}>
                  {formFields.map((field, index) => (
                    <div key={field.name} style={{ marginBottom: '1rem' }}>
                      <label 
                        htmlFor={field.name} 
                        style={{ 
                          display: 'block', 
                          marginBottom: '0.25rem',
                          fontWeight: field.required ? 'bold' : 'normal'
                        }}
                      >
                        {field.name} {field.required && '*'}
                      </label>
                      {field.type === 'object' ? (
                        <textarea
                          id={field.name}
                          value={field.value}
                          onChange={(e) => updateFieldValue(index, e.target.value)}
                          placeholder="Enter JSON object"
                          style={{ 
                            width: '100%', 
                            padding: '0.5rem',
                            minHeight: '100px',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      ) : field.type === 'boolean' ? (
                        <select
                          id={field.name}
                          value={field.value}
                          onChange={(e) => updateFieldValue(index, e.target.value)}
                          style={{ 
                            width: '100%', 
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        >
                          <option value="">-- Select --</option>
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input
                          id={field.name}
                          type={field.type}
                          value={field.value}
                          onChange={(e) => updateFieldValue(index, e.target.value)}
                          required={field.required}
                          placeholder={field.type === 'number' ? '0' : `Enter ${field.name}`}
                          style={{ 
                            width: '100%', 
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      )}
                    </div>
                  ))}

                  <button 
                    type="submit"
                    disabled={isLoading}
                    style={{ 
                      marginTop: '1rem', 
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.6 : 1
                    }}
                  >
                    {isLoading ? 'Executing...' : 'Execute'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <div>
          <h2>Response</h2>
          {error && (
            <div style={{ 
              backgroundColor: '#ffebee', 
              padding: '1rem', 
              marginBottom: '1rem',
              border: '1px solid #ef5350',
              borderRadius: '4px',
              color: '#c62828'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {output && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <h3 style={{ margin: 0 }}>Success</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.875rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Copy
                </button>
              </div>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '1rem',
                overflow: 'auto',
                maxHeight: '400px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '0.9rem'
              }}>
                {output}
              </pre>
            </div>
          )}

          {!output && !error && selectedRoute && (
            <div style={{ 
              padding: '2rem',
              textAlign: 'center',
              color: '#999'
            }}>
              Fill in the parameters and click Execute to test the procedure
            </div>
          )}
        </div>
      </div>
    </div>
  );
}