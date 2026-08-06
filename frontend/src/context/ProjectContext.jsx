import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ProjectContext = createContext();

// Load local datasets from sessionStorage
function loadLocalDatasets() {
  try {
    const raw = sessionStorage.getItem('insightai_local_datasets');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveLocalDatasets(datasets) {
  try {
    sessionStorage.setItem('insightai_local_datasets', JSON.stringify(datasets));
  } catch { /* quota exceeded - skip */ }
}

export function ProjectProvider({ children }) {
  const [activeFileId, setActiveFileId] = useState('sample-sales-001');
  const [localDatasets, setLocalDatasets] = useState(() => loadLocalDatasets());
  const [filesList, setFilesList] = useState([
    {
      id: 'sample-sales-001',
      originalName: 'sales.csv',
      fileType: 'csv',
      rowCount: 34,
      columnCount: 8,
      createdAt: new Date().toISOString()
    }
  ]);

  // Add a locally-parsed dataset (no backend needed)
  const addLocalDataset = useCallback((records, originalName, fileType) => {
    const id = `local-${Date.now()}`;
    const cols = Object.keys(records[0] || {});
    const meta = {
      id,
      originalName,
      fileType,
      rowCount: records.length,
      columnCount: cols.length,
      records,
      createdAt: new Date().toISOString(),
      isLocal: true
    };

    setLocalDatasets(prev => {
      const updated = { ...prev, [id]: meta };
      saveLocalDatasets(updated);
      return updated;
    });

    setFilesList(prev => {
      const filtered = prev.filter(f => !f.isLocal || f.id !== id);
      return [meta, ...filtered];
    });

    setActiveFileId(id);
    return meta;
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await api.get('/files');
      if (res.data.files && res.data.files.length > 0) {
        const backendFiles = res.data.files;
        // Merge local + backend files (local first)
        const localMetas = Object.values(localDatasets);
        setFilesList([...localMetas, ...backendFiles]);
        // Only switch to backend file if currently on sample and no local file active
        if (activeFileId === 'sample-sales-001' && localMetas.length === 0) {
          setActiveFileId(backendFiles[0].id);
        }
      }
    } catch (err) {
      console.warn('Files fetch error, using default sample');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <ProjectContext.Provider value={{
      activeFileId,
      setActiveFileId,
      filesList,
      setFilesList,
      fetchFiles,
      localDatasets,
      addLocalDataset
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
