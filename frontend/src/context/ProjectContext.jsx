import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [activeFileId, setActiveFileId] = useState('sample-sales-001');
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

  const fetchFiles = async () => {
    try {
      const res = await api.get('/files');
      if (res.data.files && res.data.files.length > 0) {
        setFilesList(res.data.files);
        if (!activeFileId || !res.data.files.find(f => f.id === activeFileId)) {
          setActiveFileId(res.data.files[0].id);
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
    <ProjectContext.Provider value={{ activeFileId, setActiveFileId, filesList, setFilesList, fetchFiles }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
