import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '@/shared/lib/trpcClient';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/shared/lib/trpcClient';
import './ApiKeys.styles.css';

/**
 * Type definitions for API keys
 */
type RouterOutputs = inferRouterOutputs<AppRouter>;
type ApiKey = RouterOutputs['auth']['apiKeys']['list'][number];

/**
 * ApiKeys component for managing API keys
 * Allows creating, revoking, and updating API keys
 */
export function ApiKeys() {
  // State management
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

  /**
   * Fetch API keys on component mount
   */
  useEffect(() => {
    fetchApiKeys();
  }, []);

  /**
   * Fetch API keys from the server
   */
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

  /**
   * Create a new API key
   */
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
      setShowCreateForm(false);
    } catch (err) {
      console.error('[ApiKeys] Failed to create key:', err);
      setError('Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Revoke an API key
   */
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

  /**
   * Update an API key's name
   */
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

  /**
   * Start editing an API key
   */
  const startEditing = (key: ApiKey) => {
    setEditingKeyId(key.id);
    setEditingName(key.name);
  };

  /**
   * Cancel editing an API key
   */
  const cancelEditing = () => {
    setEditingKeyId(null);
    setEditingName('');
  };

  /**
   * Copy text to clipboard
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('API key copied to clipboard!');
  };

  return (
    <div className="api-keys">
      <header className="api-keys__header">
        <div>
          <h1 className="api-keys__title">API Keys</h1>
          <p className="api-keys__subtitle">
            Manage API keys for SDK authentication and programmatic access
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="api-keys__create-button"
        >
          {showCreateForm ? (
            <>
              <span className="material-icons">close</span>
              Cancel
            </>
          ) : (
            <>
              <span className="material-icons">vpn_key</span>
              Create New API Key
            </>
          )}
        </button>
      </header>

      {error && (
        <div className="api-keys__error">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      {/* New API Key Display */}
      {newApiKey && (
        <div className="api-keys__new-key">
          <div className="api-keys__new-key-header">
            <h3 className="api-keys__new-key-title">
              <span className="material-icons">vpn_key</span>
              New API Key Created
            </h3>
            <button 
              className="api-keys__new-key-close"
              onClick={() => setNewApiKey(null)}
              aria-label="Close"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          <p className="api-keys__new-key-warning">
            <strong>Important:</strong> Copy this key now. You won't be able to see it again!
          </p>
          <div className="api-keys__new-key-value">
            {newApiKey}
          </div>
          <div className="api-keys__new-key-actions">
            <button
              onClick={() => copyToClipboard(newApiKey)}
              className="api-keys__new-key-copy"
            >
              <span className="material-icons">content_copy</span>
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && !newApiKey && (
        <div className="api-keys__create-form">
          <h3 className="api-keys__form-title">Create New API Key</h3>
          <form onSubmit={handleCreateKey}>
            <div className="api-keys__form-group">
              <label className="api-keys__form-label">
                Key Name *
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                required
                placeholder="e.g., Production App, Development Testing"
                className="api-keys__form-input"
              />
              <small className="api-keys__form-help">
                A descriptive name to help you identify this key
              </small>
            </div>

            <div className="api-keys__form-group">
              <label className="api-keys__form-label">
                Expiration
              </label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value as any)}
                className="api-keys__form-select"
              >
                <option value="never">Never expires</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
            </div>

            <div className="api-keys__form-actions">
              <button
                type="submit"
                disabled={isCreating || !keyName.trim()}
                className={`api-keys__form-button ${isCreating ? 'api-keys__form-button--loading' : ''}`}
              >
                {isCreating ? (
                  <>
                    <div className="api-keys__button-spinner"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="material-icons">add</span>
                    Create Key
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* API Keys Table */}
      <div className="api-keys__table-container">
        {isLoading ? (
          <div className="api-keys__loading">
            <div className="api-keys__loading-spinner"></div>
            <p>Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="api-keys__empty">
            <span className="material-icons api-keys__empty-icon">vpn_key_off</span>
            <p>No API keys yet. Create one to get started!</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="api-keys__empty-button"
            >
              <span className="material-icons">add</span>
              Create API Key
            </button>
          </div>
        ) : (
          <table className="api-keys__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key Prefix</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Used</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id} className={!key.is_active ? 'api-keys__row--inactive' : ''}>
                  <td>
                    {editingKeyId === key.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="api-keys__edit-input"
                        autoFocus
                      />
                    ) : (
                      <span className="api-keys__key-name">{key.name}</span>
                    )}
                  </td>
                  <td className="api-keys__key-prefix">{key.key_prefix}</td>
                  <td>
                    <span className={`api-keys__status ${key.is_active ? 'api-keys__status--active' : 'api-keys__status--revoked'}`}>
                      {key.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td>{new Date(key.created_at).toLocaleDateString()}</td>
                  <td>{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</td>
                  <td>{key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}</td>
                  <td>
                    {editingKeyId === key.id ? (
                      <div className="api-keys__edit-actions">
                        <button
                          onClick={() => handleUpdateKey(key.id)}
                          className="api-keys__action-button api-keys__action-button--save"
                          disabled={!editingName.trim()}
                        >
                          <span className="material-icons">save</span>
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="api-keys__action-button api-keys__action-button--cancel"
                        >
                          <span className="material-icons">close</span>
                        </button>
                      </div>
                    ) : (
                      <div className="api-keys__actions">
                        {key.is_active && (
                          <>
                            <button
                              onClick={() => startEditing(key)}
                              className="api-keys__action-button api-keys__action-button--edit"
                              title="Edit name"
                            >
                              <span className="material-icons">edit</span>
                            </button>
                            <button
                              onClick={() => handleRevokeKey(key.id)}
                              className="api-keys__action-button api-keys__action-button--revoke"
                              title="Revoke key"
                            >
                              <span className="material-icons">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="api-keys__instructions">
        <h3 className="api-keys__instructions-title">
          <span className="material-icons">help_outline</span>
          How to use API keys
        </h3>
        
        <div className="api-keys__docs-link">
          <Link to="/app/api-docs" className="api-keys__docs-button">
            <span className="material-icons">description</span>
            View Complete API Documentation
          </Link>
          <p>See full endpoint reference, examples, and best practices</p>
        </div>
        
        <p>Include your API key in the x-api-key header of your requests:</p>
        <div className="api-keys__code">
          <code>x-api-key: YOUR_API_KEY</code>
        </div>
        
        <h4 className="api-keys__instructions-subtitle">Example with curl</h4>
        <div className="api-keys__code">
          <pre><code>{`curl -H "x-api-key: YOUR_API_KEY" \\
  https://api.storyengine.dev/api/worlds`}</code></pre>
        </div>
        
        <h4 className="api-keys__instructions-subtitle">Example with JavaScript</h4>
        <div className="api-keys__code">
          <pre><code>{`const response = await fetch('https://api.storyengine.dev/api/worlds', {
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const worlds = await response.json();`}</code></pre>
        </div>
        
        <div className="api-keys__security-tips">
          <h4 className="api-keys__instructions-subtitle">
            <span className="material-icons">security</span>
            Security Best Practices
          </h4>
          <ul className="api-keys__tips-list">
            <li>Never commit API keys to version control</li>
            <li>Use environment variables to store keys</li>
            <li>Rotate keys regularly (every 90 days recommended)</li>
            <li>Set expiration dates when creating keys</li>
            <li>Revoke unused keys immediately</li>
            <li>Use different keys for different environments (dev, staging, prod)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}