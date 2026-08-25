import React, { useEffect } from "react";
import Loading from "../components/Loading";
import FullPagePreview from "../components/FullPagePreview";
import { useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const PreviewPage = () => {
  const { id } = useParams();
  const { activeProject: project, loadingActiveProject: loading, loadProject } = useAppContext();

  useEffect(() => {
    if (!id) return;
    loadProject(id);
  }, [id, loadProject]);

  if (loading || !project) {
    return <Loading />
  }

  return (
    <div>
      <FullPagePreview files={project.files} />
    </div>
  );
};

export default PreviewPage;