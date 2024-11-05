import { useState } from 'react';
import { Modal, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import * as dotenv from 'dotenv';  // Import the dotenv parser
import * as API from "../API";
import CustomNodeModel from "./CustomNode/CustomNodeModel";

const EnvUploadModal = ({ visible, onClose, possibleNodes, onUpdate }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [pendingAddNodeCalls, setPendingAddNodeCalls] = useState(0)

  // Look up option types from appropriate menu item.
  // The option types aren't included in the global flow
  // serialization from the server.
  function lookupOptionTypes(nodeKey) {
    const keyMatches = possibleNodes.filter((d) => d.node_key === nodeKey);
    if (!keyMatches.length) return {};
    return keyMatches[0].option_types || {};
  }

  function nodeFromData(data) {
    const info = { ...data, is_global: true };
    const config = info.options;
    delete info.options;
    if (!info.option_types) {
      info.option_types = lookupOptionTypes(info.node_key);
    }
    const node = new CustomNodeModel(info, config);
    return node;
  }

  const handleUpload = () => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload.');
      return;
    }
    
    const file = fileList[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const fileContent = e.target.result;
      // Parse the .env content to extract variables
      const parsedEnv = dotenv.parse(fileContent);
      
      // Send each env variable to the backend
      setUploading(true);
      try {
        for (const [key, value] of Object.entries(parsedEnv)) {
          setPendingAddNodeCalls(pendingAddNodeCalls + 1);
          // Create a new node
          const config = { 
            default_value: value,
            description: "From env file",
            var_name: key
          }

          const varFileName = (!isNaN(value) && value !== '' && typeof value === 'string') || typeof value === 'number'
          ? 'integer_input'
          : 'string_input';        
          
          const varTypeNode = possibleNodes.find((node) => (node.filename == varFileName));
          const node = nodeFromData(varTypeNode);            
          node.config = config;
          API.addNode(node)
            .then((res) => {
                console.log(res);
                setPendingAddNodeCalls(pendingAddNodeCalls -1 );
                if (pendingAddNodeCalls === 0) {
                  setTimeout(() => {
                    // Update the UI
                    onUpdate();
                  }, 100); // adjust the delay as needed      
                }          
            })
            .catch((err) => 
                console.log(err)
            );
        }
        message.success('Environment variables uploaded successfully.');
        onClose(); // Close the modal on success
      } catch (error) {
        console.error("Error uploading variables:", error);
        message.error('Failed to upload environment variables.');
      } finally {
        setUploading(false);
      }
    };
    
    reader.onerror = () => {
      message.error('Failed to read file.');
    };

    reader.readAsText(file);
  };

  return (
    <Modal
      visible={visible}
      title="Upload Environment Variables"
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="upload"
          type="primary"
          loading={uploading}
          onClick={handleUpload}
          disabled={fileList.length === 0}
        >
          Upload
        </Button>,
      ]}
    >
      <Upload
        beforeUpload={(file) => {
          setFileList([file]);
          return false;  // Prevent automatic upload
        }}
        onRemove={() => setFileList([])}
        fileList={fileList}
      >
        <Button icon={<UploadOutlined />}>Select .env File</Button>
      </Upload>
    </Modal>
  );
};

export default EnvUploadModal;
