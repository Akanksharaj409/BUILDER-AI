import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import PromptInput from "../components/PromptInput";
import { ArrowRightIcon, ClockIcon, Trash2Icon } from "lucide-react";
import moment from "moment";

const homeTags = [
  "SaaS Landing Page",
  "Portfolio Website",
  "E-commerce Store",
  "AI Dashboard",
  "Blog Platform",
  "Web3 App"
];

const HomePage = () => {
  const navigate = useNavigate();
  const {
    user,
    loadingUser,
    projects,
    loadProjects,
    handleGenerate,
    generatingProject,
    handleDelete,
    logout
  } = useAppContext();

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user, loadProjects]);

  return (
    <div className="h-screen overflow-y-auto text-white font-sans bg-[url('/bg-img.png')] bg-cover bg-no-repeat">
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="logo" className="size-6" />
          <span className="text-xl font-semibold tracking-tight">Builder AI</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-zinc-400">
          <span>{user?.name || user?.email}</span>
          <button
            onClick={logout}
            className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20 mt-8 xl:mt-28">
        <div className="w-full max-w-2xl flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 p-1.5 pr-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[13px] text-white/90 mb-4">
            <span className="px-3 py-1 text-[11px] bg-red-700 rounded-full font-medium tracking-wider">PROMO</span>
            <span>Create your first project for free</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-4">
            Build your presence on web
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl mb-6">
            Describe what you need, preview instantly, and customize your site in real time. React with clean JSX, verified layouts, and instant code exports.
          </p>

          <div className="w-full mt-2">
            <PromptInput
              onSubmit={handleGenerate}
              loading={generatingProject}
              placeholder="Create a portfolio website..."
              variant="glass"
              autoFocus
            />
          </div>

          {/* Tags */}
          <div className="masked-marquee w-full mt-6 max-w-2xl overflow-hidden py-1">
            <div className="animate-marquee gap-3 flex">
              {homeTags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => handleGenerate(tag)}
                  disabled={generatingProject}
                  className="px-4 py-1.5 border rounded-full text-sm text-white bg-white/10 border-white/25 hover:bg-white/20 transition cursor-pointer shrink-0 font-medium disabled:opacity-50"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Projects List */}
          {!loadingUser && (
            <div className="mt-12 w-full text-left">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <p className="text-xs font-medium uppercase tracking-widest text-zinc-300">All Projects</p>
                <span className="text-xs text-zinc-300 font-normal">
                  {projects?.length || 0} {projects?.length === 1 ? "Project" : "Projects"}
                </span>
              </div>

              {projects && projects.length > 0 ? (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {projects.map((project) => (
                    <div
                      key={project._id}
                      className="group p-4 bg-zinc-800/60 hover:bg-zinc-800/90 border border-white/10 hover:border-white/20 rounded-xl shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-all"
                      onClick={() => navigate(`/builder/${project._id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{project.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <ClockIcon size={12} />
                            {moment(project.updatedAt || project.createdAt).fromNow()}
                          </span>
                          <span className="text-xs text-zinc-500 font-medium">
                            v{project.version}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(project._id);
                          }}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete project"
                        >
                          <Trash2Icon size={16} />
                        </button>
                        <ArrowRightIcon size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-zinc-800/40 border border-white/10 rounded-xl text-zinc-400 text-sm">
                  No projects created yet. Describe what you want above to build your first website!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;