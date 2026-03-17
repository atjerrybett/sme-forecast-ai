'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { supabase } from '@/lib/supabase';

export default function UploadPage() {
  const router = useRouter();
  const { isLoading, user } = useProtectedRoute();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [datasetName, setDatasetName] = useState('');

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setDatasetName(selectedFile.name.replace('.csv', ''));
  };

  const handleUpload = async () => {
    if (!file || !user || !datasetName.trim()) {
      setError('Please select a file and enter a dataset name');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const fileContent = await file.text();
      const lines = fileContent.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setError('CSV file must have at least a header and one data row');
        setUploading(false);
        return;
      }

      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line =>
        line.split(',').map(cell => cell.trim())
      );

      // Validate required columns
      const hasDate = headers.some(h => h.includes('date'));
      const hasAmount = headers.some(h => h.includes('amount'));

      if (!hasDate || !hasAmount) {
        setError('CSV must contain "date" and "amount" columns');
        setUploading(false);
        return;
      }

      // Create dataset record
      const { data: dataset, error: datasetError } = await supabase
        .from('datasets')
        .insert({
          user_id: user.id,
          name: datasetName,
          row_count: rows.length,
        })
        .select()
        .single();

      if (datasetError) throw datasetError;

      // Insert transactions
      const transactions = rows
        .map((row) => {
          const dateIdx = headers.findIndex(h => h.includes('date'));
          const amountIdx = headers.findIndex(h => h.includes('amount'));
          const descIdx = headers.findIndex(h => h.includes('description') || h.includes('desc'));
          const categoryIdx = headers.findIndex(h => h.includes('category'));

          const amount = parseFloat(row[amountIdx]);
          if (isNaN(amount)) return null;

          return {
            dataset_id: dataset.id,
            date: row[dateIdx],
            description: descIdx >= 0 ? row[descIdx] : '',
            amount,
            category: categoryIdx >= 0 ? row[categoryIdx] : 'Other',
          };
        })
        .filter(Boolean);

      if (transactions.length === 0) {
        setError('No valid transactions found in CSV');
        setUploading(false);
        return;
      }

      const { error: txError } = await supabase
        .from('transactions')
        .insert(transactions);

      if (txError) {
        console.error('Transaction insert error:', txError);
        throw new Error(`Failed to insert transactions: ${txError.message}`);
      }

      setProgress(100);
      setTimeout(() => {
        router.push('/dashboard/transactions');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Financial Data</h1>
        <p className="mt-2 text-gray-600">
          Upload a CSV file with your financial transactions to get started
        </p>
      </div>

      <div className="max-w-2xl">
        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="absolute inset-0 hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg font-semibold text-gray-900">Drag and drop your CSV file</p>
            <p className="mt-2 text-sm text-gray-600">or click to browse</p>
            <p className="mt-4 text-xs text-gray-500">
              Maximum file size: 10MB | Format: CSV
            </p>
          </label>
        </div>

        {/* File Info */}
        {file && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-900">
              ✓ File selected: {file.name}
            </p>
            <p className="text-xs text-green-700">
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {/* Dataset Name */}
        {file && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dataset Name
            </label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="e.g., Q1 2024 Transactions"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">⚠ {error}</p>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && progress > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Uploading...</p>
              <p className="text-sm text-gray-600">{progress}%</p>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
          <button
            onClick={() => {
              setFile(null);
              setDatasetName('');
              setError(null);
            }}
            disabled={uploading}
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>

        {/* Requirements */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-gray-900 mb-4">CSV Format Requirements</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Must include <code className="bg-gray-100 px-2 py-1 rounded">date</code> column</li>
            <li>✓ Must include <code className="bg-gray-100 px-2 py-1 rounded">amount</code> column</li>
            <li>✓ Optional: <code className="bg-gray-100 px-2 py-1 rounded">description</code> and <code className="bg-gray-100 px-2 py-1 rounded">category</code></li>
            <li>✓ Date format: YYYY-MM-DD</li>
            <li>✓ Maximum 10MB file size</li>
          </ul>
          <div className="mt-4">
            <p className="text-xs text-gray-600 mb-2">Example CSV:</p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`date,description,amount,category
2024-01-15,Rent Payment,-1500,Expenses
2024-01-20,Product Sales,5000,Income
2024-01-25,Utilities,-200,Expenses`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
