import { useState, useEffect } from 'react';
import { trpc } from '@/shared/lib/trpcClient';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/shared/lib/trpcClient';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ApiKey = RouterOutputs['auth']['apiKeys']['list'][number];

export function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  
  // Form state
  const [keyName, setKeyName] = useState('');
  const [expiresIn, setExpiresIn] = useState<'never' | '30' | '90' | '365'>('never');
  
  // Edit state
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const keys = await trpc.auth.apiKeys.list.query();
      setApiKeys(keys);
    } catch (err) {
      console.error('[ApiKeys] Failed to fetch keys:', err);
      setError('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      const expiresAt = expiresIn === 'never' 
        ? undefined 
        : new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000);

      const result = await trpc.auth.apiKeys.create.mutate({
        name: keyName,
        expires_at: expiresAt
      });

      setNewApiKey(result.key);
      setApiKeys(prev => [...prev, {
        id: result.id,
        name: result.name,
        key_prefix: result.key_prefix,
        created_at: result.created_at,
        last_used_at: null,
        expires_at: result.expires_at,
        is_active: true
      }]);
      
      setKeyName('');
      setExpiresIn('never');
    } catch (err) {
      console.error('[ApiKeys] Failed to create key:', err);
      setError('Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await trpc.auth.apiKeys.revoke.mutate({ keyId });
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, is_active: false } : key
      ));
    } catch (err) {
      console.error('[ApiKeys] Failed to revoke key:', err);
      setError('Failed to revoke API key');
    }
  };

  const handleUpdateKey = async (keyId: string) => {
    try {
      await trpc.auth.apiKeys.update.mutate({
        keyId,
        name: editingName
      });
      
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, name: editingName } : key
      ));
      
      setEditingKeyId(null);
      setEditingName('');
    } catch (err) {
      console.error('[ApiKeys] Failed to update key:', err);
      setError('Failed to update API key');
    }
  };

  const startEditing = (key: ApiKey) => {
    setEditingKeyId(key.id);
    setEditingName(key.name);
  };

  const cancelEditing = () => {
    setEditingKeyId(null);
    setEditingName('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple feedback - in production you'd want a toast notification
    alert('API key copied to clipboard!');
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading API keys...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>API Keys</h1>
        <p style={{ color: '#666' }}>
          Manage API keys for SDK authentication. These keys allow programmatic access to your worlds.
        </p>
      </header>

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          padding: '1rem',
          marginBottom: '1rem',
          border: '1px solid #ef5350',
          borderRadius: '4px',
          color: '#c62828'
        }}>
          {error}
        </div>
      )}

      {/* New API Key Display */}
      {newApiKey && (
        <div style={{
          backgroundColor: '#e8f5e9',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid #4caf50',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0, color: '#2e7d32' }}>New API Key Created</h3>
          <p style={{ marginBottom: '1rem' }}>
            <strong>Important:</strong> Copy this key now. You won't be able to see it again!
          </p>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            wordBreak: 'break-all',
            marginBottom: '1rem'
          }}>
            {newApiKey}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => copyToClipboard(newApiKey)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Copy to Clipboard
            </button>
            <button
              onClick={() => setNewApiKey(null)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          {showCreateForm ? 'Cancel' : 'Create New API Key'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && !newApiKey && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginTop: 0 }}>Create New API Key</h3>
          <form onSubmit={handleCreateKey}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Key Name *
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                required
                placeholder="e.g., Production App, Development Testing"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
              <small style={{ color: '#666' }}>
                A descriptive name to help you identify this key
              </small>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Expiration
              </label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              >
                <option value="never">Never expires</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                disabled={isCreating || !keyName.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  opacity: isCreating ? 0.6 : 1
                }}
              >
                {isCreating ? 'Creating...' : 'Create Key'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* API Keys Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #ddd',
        overflow: 'hidden'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Name
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Key Prefix
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Status
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Created
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Last Used
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Expires
              </th>
              <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.length === 0 ? (
              <tr>
                <td colSpan={7} style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  No API keys yet. Create one to get started!
                </td>
              </tr>
            ) : (
              apiKeys.map((key) => (
                <tr key={key.id}>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    {editingKeyId === key.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          width: '200px'
                        }}
                      />
                    ) : (
                      <strong>{key.name}</strong>
                    )}
                  </td>
                  <td style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid #eee',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }}>
                    {key.key_prefix}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    <span style={{
                      backgroundColor: key.is_active ? '#e8f5e9' : '#ffebee',
                      color: key.is_active ? '#2e7d32' : '#c62828',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}>
                      {key.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    {new Date(key.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    {key.last_used_at 
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    {key.expires_at 
                      ? new Date(key.expires_at).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid #eee',
                    textAlign: 'right'
                  }}>
                    {editingKeyId === key.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateKey(key.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            marginRight: '0.5rem'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#f5f5f5',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {key.is_active && (
                          <button
                            onClick={() => startEditing(key)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              marginRight: '0.5rem'
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {key.is_active && (
                          <button
                            onClick={() => handleRevokeKey(key.id)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Usage Instructions */}
      <div style={{
        marginTop: '2rem',
        backgroundColor: '#f5f5f5',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0 }}>How to use API keys</h3>
        <p>Include your API key in the Authorization header of your requests:</p>
        <pre style={{
          backgroundColor: '#333',
          color: '#fff',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto'
        }}>
{`Authorization: Bearer YOUR_API_KEY

// Example with curl
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.storyengine.dev/trpc/world.list

// Example with JavaScript SDK
const client = new StoryEngineClient({
  apiKey: 'YOUR_API_KEY'
});`}
        </pre>
      </div>
    </div>
  );
}