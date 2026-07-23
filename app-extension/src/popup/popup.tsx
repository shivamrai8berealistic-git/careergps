import { h, render, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { ExtractedJobData, ExtensionMessage } from '../shared/types';

const Popup = () => {
  const [jobDetected, setJobDetected] = useState<boolean>(false);
  const [jobData, setJobData] = useState<ExtractedJobData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Query the active tab to send a message to the content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: 'GET_PAGE_STATUS' },
          (response) => {
            if (chrome.runtime.lastError) {
                // This can happen if the content script hasn't been injected yet or the page is protected.
                console.error("CareerPilot Popup:", chrome.runtime.lastError.message);
                setError("Couldn't connect to the page. Please refresh and try again.");
                setLoading(false);
                return;
            }
            
            if (response && response.type === 'PAGE_STATUS_RESPONSE') {
              setJobDetected(response.jobDetected);
              setJobData(response.jobData);
            }
            setLoading(false);
          }
        );
      } else {
        setError("Could not find an active tab.");
        setLoading(false);
      }
    });
  }, []);

  const handleAnalyzeClick = () => {
    if (jobData) {
      chrome.runtime.sendMessage({ type: 'ANALYZE_JOB', jobData });
      window.close(); // Close the popup after sending the message
    }
  };
  
  const styles = {
    container: {
        padding: '16px',
        textAlign: 'center',
        color: '#111827',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '16px',
    },
    title: {
        fontSize: '18px',
        fontWeight: 'bold',
    },
    status: {
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '16px',
        minHeight: '40px',
    },
    button: {
        width: '100%',
        padding: '10px',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: '#2074d4',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
        cursor: 'not-allowed',
    },
    loader: {
        fontSize: '14px',
        color: '#6b7280',
    },
    error: {
        fontSize: '14px',
        color: '#be123c',
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div style={styles.loader}>Scanning page for job details...</div>;
    }
    if (error) {
        return <p style={styles.error}>{error}</p>
    }
    if (jobDetected && jobData) {
      return (
        <>
          <p style={styles.status}>
            <strong>Job Found:</strong><br/>{jobData.title?.substring(0, 50)}{jobData.title && jobData.title.length > 50 ? '...' : ''}
          </p>
          <button style={styles.button} onClick={handleAnalyzeClick}>
            Save & Analyze in CareerPilot
          </button>
        </>
      );
    }
    return (
      <p style={styles.status}>No job details found on this page. Navigate to a job posting to get started.</p>
    );
  };
  
  const Icon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2074d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.05 3.05a7 7 0 0 0-10 10" />
      <path d="M3.05 15.05a7 7 0 0 0 10 10" />
      <path d="M12 12s-3-4-8-4 1 8 4 8 4-4 4-4Z" />
      <path d="M12 12s3 4 8 4-1-8-4-8-4 4-4 4Z" />
    </svg>
  );

  return (
    <div style={styles.container}>
        <div style={styles.header}>
            <Icon />
            <h1 style={styles.title}>CareerPilot AI</h1>
        </div>
      {renderContent()}
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  render(<Popup />, root);
}
