// pages/upload.js or app/upload/page.js for App Router
'use client'
import React, { ChangeEvent, useState } from 'react';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);
  };

  const handleUpload = async () => {
    if (!selectedFile || !textInput) {
      alert("Please select a file and enter some text.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('text', textInput);

    try {
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      alert('Upload successful');
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error uploading');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-md rounded-md border border-gray-200">
      <h1 className="text-2xl font-semibold text-center mb-6">Upload File and Text</h1>

      <div className="mb-4">
        <label htmlFor="fileUpload" className="block text-gray-700 font-medium mb-2">
          Select a file:
        </label>
        <input
          type="file"
          id="fileUpload"
          onChange={handleFileChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="textInput" className="block text-gray-700 font-medium mb-2">
          Enter some text:
        </label>
        <input
          type="text"
          id="textInput"
          value={textInput}
          onChange={handleTextChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          placeholder="Type something..."
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={isUploading}
        className={`w-full py-2 px-4 text-white font-semibold rounded-md focus:outline-none transition duration-150 ease-in-out ${
          isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
