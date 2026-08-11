import React, { useState, useEffect } from 'react';
import { CloudUpload, CheckCircle, AlertTriangle, ExternalLink, Copy, X, Key } from 'lucide-react';
import { getGasUrl, setGasUrl, syncGameToGas } from '../services/syncService';

export default function SyncModal({ isOpen, onClose, currentGame, onSyncSuccess }) {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getGasUrl());
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    setGasUrl(urlInput);
    setSuccessMsg('GAS Web App URL saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSyncNow = async () => {
    if (!currentGame) return;
    setGasUrl(urlInput);
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await syncGameToGas(currentGame.id);
      setSuccessMsg(res.message);
      if (onSyncSuccess) onSyncSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sync data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 leading-tight">Google Sheets Sync</h3>
              <p className="text-xs text-slate-400">Batch upload offline stats via Google Apps Script</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Google Apps Script Web App URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                onClick={handleSaveUrl}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 text-sm"
              >
                Save
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {currentGame && (
            <button
              onClick={handleSyncNow}
              disabled={loading || !urlInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Syncing to Google Sheets...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4 text-slate-950" />
                  <span>Sync Current Match Stats Now</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
          <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-2">
            <span>How to setup Google Apps Script (GAS)</span>
          </div>

          <ol className="list-decimal list-inside space-y-2 text-slate-300">
            <li>Open your Google Sheet and click <b>Extensions &gt; Apps Script</b>.</li>
            <li>Replace the script content with the code from <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">gas/Code.gs</code> in this project.</li>
            <li>Click <b>Deploy &gt; New deployment</b>.</li>
            <li>Select Type: <b>Web App</b>.</li>
            <li>Execute as: <b>Me</b>, Who has access: <b>Anyone</b>.</li>
            <li>Copy the Web App URL and paste it into the field above!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
