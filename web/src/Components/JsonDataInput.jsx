import { useState } from 'react';
import { Upload, Button, Input } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import NodeDataExplorer from './NodeDataExplorer'; // Import your NodeDataExplorer component

const { TextArea } = Input;

const JsonDataInput = ({ jsonData, setJsonData }) => {
  const [showBackground, setShowBackground] = useState(!jsonData); // Show background if no jsonData
  const [selectionMade, setSelectionMade] = useState(false); // Keeps track if file or data source was selected

  // Handle file upload
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      setJsonData(fileContent);
      setShowBackground(false);
      setSelectionMade(true);
    };
    reader.readAsText(file);
    return false; // Prevent automatic upload
  };

  // Handle data selection from NodeDataExplorer
  const handleNodeDataSelected = (jsonObject) => {
    setJsonData(JSON.stringify(jsonObject, null, 2));
    setShowBackground(false);
    setSelectionMade(true);
  };

  // Reset function to allow reselection of file or data source
  const handleReset = () => {
    setJsonData('');
    setShowBackground(true);
    setSelectionMade(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginTop: 20 }}>
      {/* TextArea for JSON Data */}
      <TextArea
        value={jsonData}
        onChange={(e) => setJsonData(e.target.value)}
        rows={6}
        placeholder="Upload a file or select a data source..."
      />

      {/* Background for file upload and data source selection */}
      {showBackground && !selectionMade && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
          textAlign: 'center',
          zIndex: 1,
        }}>
          <p>Upload a file or select a data source</p>

          {/* File Upload */}
          <Upload beforeUpload={handleFileUpload} showUploadList={false}>
            <Button icon={<UploadOutlined />}>Upload File</Button>
          </Upload>

          {/* Collapse for Data Source Selection */}
          <NodeDataExplorer handleNodeData={handleNodeDataSelected} />
        </div>
      )}

      {/* Reset button to clear the selection */}
      {jsonData && (
        <div style={{ marginTop: 10 }}>
          <Button type="dashed" onClick={handleReset}>
            Reset Selection
          </Button>
        </div>
      )}
    </div>
  );
};

export default JsonDataInput;
