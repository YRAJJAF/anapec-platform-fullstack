import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

export type UserRole = 'CANDIDATE' | 'ADMIN' | 'EVALUATOR' | 'COACH' | 'SUPER_ADMIN';
export interface User { id:string; email:string; firstName:string; lastName:string; role:UserRole; region?:string; city?:string; agency?:string; }
export interface RegisterData { email:string; password:string; firstName:string; lastName:string; cin?:string; phone?:string; region?:string; city?:string; agency?:string; }

interface AuthState {
  user: User|null; accessToken:string|null; refreshToken:string|null;
  isLoading:boolean; isAuthenticated:boolean;
  login:(e:string,p:string)=>Promise<void>;
  register:(d:RegisterData)=>Promise<void>;
  logout:()=>Promise<void>;
  loadUser:()=>Promise<void>;
  setUser:(u:User)=>void;
}

export const useAuthStore = create<AuthState>()(
  persist((set, get) => ({
    user:null, accessToken:null, refreshToken:null, isLoading:false, isAuthenticated:false,
    login: async (email,password) => {
      set({isLoading:true});
      try {
        const res = await authApi.login({email,password}) as any;
        const {accessToken,refreshToken,user} = res.data;
        if(typeof window!=='undefined'){localStorage.setItem('accessToken',accessToken);localStorage.setItem('refreshToken',refreshToken);localStorage.setItem('userId',user.id);}
        set({user,accessToken,refreshToken,isAuthenticated:true,isLoading:false});
      } catch(e){set({isLoading:false});throw e;}
    },
    register: async (data) => {
      set({isLoading:true});
      try {
        const res = await authApi.register(data) as any;
        const {accessToken,refreshToken,user} = res.data;
        if(typeof window!=='undefined'){localStorage.setItem('accessToken',accessToken);localStorage.setItem('refreshToken',refreshToken);localStorage.setItem('userId',user.id);}
        set({user,accessToken,refreshToken,isAuthenticated:true,isLoading:false});
      } catch(e){set({isLoading:false});throw e;}
    },
    logout: async () => {
      try { await authApi.logout(get().refreshToken??undefined); } catch {}
      localStorage.clear();
      set({user:null,accessToken:null,refreshToken:null,isAuthenticated:false});
    },
    loadUser: async () => {
      const token = typeof window!=='undefined'?localStorage.getItem('accessToken'):null;
      if(!token) return;
      try { const res = await authApi.me() as any; set({user:res.data,isAuthenticated:true}); }
      catch { localStorage.clear(); set({user:null,isAuthenticated:false}); }
    },
    setUser:(user)=>set({user}),
  }),{name:'auth-store',partialize:(s)=>({user:s.user,accessToken:s.accessToken,refreshToken:s.refreshToken,isAuthenticated:s.isAuthenticated})}),
);
