import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginLeft from '../components/loginLeft'
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const AuthPage = ({ mode }) => {
  const { login, register } = useAppContext();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate("/");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err?.message ||
        (mode === "login" ? "Invalid email or password" : "Email already exists")
      );
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className='min-h-screen bg-white flex text-zinc-900 font-sans'>
      {/* left panel */}
      <LoginLeft />

      {/* right panel */}
      <div className='flex-1 flex items-center justify-center p-8'>
        <div className='w-full max-w-sm'>
          <div className='mb-10'>
            <h1 className='text-2xl font-semibold mb-1 text-zinc-900'>
              {isLogin ? "Sign in" : "Create an account"}
            </h1>
            <p className='text-zinc-400 text-sm'>
              {isLogin ? "Don't have an account yet?" : "Already have an account?"}
            </p>
          </div>

          {error && (
            <div className='mb-6 p-3 border border-red-200 bg-red-50 text-red-600 text-xs rounded'>
              {error}
            </div>
          )}

          <form className='space-y-6' onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className='block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2'>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className='w-full pl-2 py-2 border-b border-zinc-200 focus:outline-none focus:border-red-600 text-sm text-zinc-900 bg-transparent placeholder-zinc-400 transition-colors'
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label className='block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2'>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='w-full pl-2 py-2 border-b border-zinc-200 focus:outline-none focus:border-red-600 text-sm text-zinc-900 bg-transparent placeholder-zinc-400 transition-colors'
                placeholder="Email Address"
              />
            </div>

            <div>
              <label className='block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2'>
                Password
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className='w-full pl-2 py-2 border-b border-zinc-200 focus:outline-none focus:border-red-600 text-sm text-zinc-900 bg-transparent placeholder-zinc-400 transition-colors'
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute top-2 right-2 text-zinc-400 hover:text-zinc-500 transition'
                >
                  {showPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className='w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 text-white font-semibold hover:scale-[1.02] disabled:opacity-40 flex items-center justify-center cursor-pointer mt-2 rounded-lg transition-all'
            >
              {loading && <Loader2Icon className='animate-spin h-3.5 w-3.5 mr-2' />}
              {isLogin ? "Sign in" : "Sign up"}
            </button>

            {/* <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await login("alex@example.com", "password123");
                  navigate("/");
                } catch (_err) {
                  setError("Failed to sign in");
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 mt-2"
            >
              ⚡ Quick Demo Sign In (Access Home Page)
            </button> */}
          </form>

          <p className='text-sm text-zinc-400 mt-8 pt-6 border-t border-zinc-100 font-sans'>
            {isLogin ? (
              <>
                New to BuilderAI?{" "}
                <Link to="/register" className="text-red-600 hover:text-red-700 font-medium transition">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link to="/login" className="text-red-600 hover:text-red-700 font-medium transition">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
