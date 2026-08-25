import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageSquareIcon, FolderTree } from 'lucide-react';
import ChatPanel from '../components/Chatpanel';
import FileExplorer from '../components/FileExplorer';
import PreviewPanel from '../components/PreviewPanel';
import Loading from '../components/Loading';
import BuilderHeader from '../components/BuilderHeader';
import AgentProgressDashboard from '../components/AgentProgressDashboard';
import PublishModal from '../components/PublishModal';
import api from '../api/api';
import { exportProjectZip } from '../utils/exportProject';
import toast from 'react-hot-toast';

const BuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leftTab, setLeftTab] = useState("chat");
  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState(null);

  const {
    activeProject,
    loadingActiveProject,
    activeFile,
    setActiveFile,
    showCode,
    setShowCode,
    loadProject,
    logout,
    chatLoading,
    handleChat,
  } = useAppContext();

  useEffect(() => {
    if (!id) return;
    loadProject(id);
  }, [id, loadProject]);

  useEffect(() => {
    if (!activeProject || !id) return;
    if (activeProject.status === 'pending' || activeProject.status === "generating") {
      const interval = setInterval(() => {
        loadProject(id, true);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [id, loadProject, activeProject]);

  const handleOpenPreview = () => {
    if (!id) return;
    window.open(`/preview/${id}`, '_blank');
  };

  const handlePublish = async () => {
    if (!id) return;
    setPublishing(true);
    try {
      await api.post(`/api/projects/${id}/publish`);
      const url = `${window.location.origin}/publish/${id}`;
      setPublishUrl(url);
      toast.success("Website published successfully!");
    } catch (error) {
      console.log("Error publishing", error);
      toast.error(error?.response?.data?.error || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleDownload = () => {
    if (!activeProject) return;
    exportProjectZip(activeProject);
  };

  if (loadingActiveProject || !activeProject) {
    return <Loading />;
  }

  return (
    <div className='h-screen flex flex-col bg-white overflow-hidden text-zinc-900 relative'>
      <BuilderHeader
        projectName={activeProject.name}
        version={activeProject.version}
        showCode={showCode}
        publishing={publishing}
        onToggleShowCode={() => { setShowCode(!showCode); }}
        onPublish={handlePublish}
        onOpenPreview={handleOpenPreview}
        onDownload={handleDownload}
        onBack={() => { navigate("/"); }}
        onLogout={logout}
      />

      <div className='flex-1 flex overflow-hidden relative'>
        <div className='w-[320px] shrink-0 flex flex-col border-r border-zinc-200 bg-white'>
          <div className='flex items-center gap-1 p-1 border-b border-zinc-200'>
            <button
              onClick={() => setLeftTab("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer ${leftTab === "chat" ? "text-zinc-900 border-b-2 border-zinc-900" : "text-zinc-400 hover:text-zinc-900"}`}
            >
              <MessageSquareIcon size={13} /> Chat
            </button>
            <button
              onClick={() => setLeftTab("files")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer ${leftTab === "files" ? "text-zinc-900 border-b-2 border-zinc-900" : "text-zinc-400 hover:text-zinc-900"}`}
            >
              <FolderTree size={13} /> File
            </button>
          </div>
          {/*sidebar content*/}
          <div className='flex-1 overflow-hidden'>
            {leftTab === "chat" ? (
              <ChatPanel messages={activeProject.messages || []} onSend={handleChat} loading={chatLoading} />
            ) : (
              <FileExplorer
                files={activeProject.files || {}}
                activeFile={activeFile}
                onFileSelect={(path) => {
                  setActiveFile(path);
                  setShowCode(true);
                }}
              />
            )}
          </div>
        </div>
        {/* Preview*/}
        <div className='flex-1 overflow-hidden'>
          {activeProject.status === "generating" || activeProject.status === "pending" || activeProject.status === "failed" ? (
            <AgentProgressDashboard project={activeProject} />
          ) : (
            <PreviewPanel project={activeProject} activeFile={activeFile} showCode={showCode} />
          )}
        </div>
      </div>
      {publishUrl && <PublishModal publishUrl={publishUrl} onClose={() => setPublishUrl(null)} />}
    </div>
  );
};


export default BuilderPage