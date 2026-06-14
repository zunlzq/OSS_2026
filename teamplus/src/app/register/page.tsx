"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return alert("모든 항목을 입력해주세요.");
    setLoading(true);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    
    if (authError) {
      setLoading(false);
      return alert("회원가입 실패: " + authError.message);
    }
    
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        { id: authData.user.id, name, email }
      ]);
      if (profileError) console.error("Profile creation error:", profileError);
    }

    setLoading(false);
    alert("회원가입이 완료되었습니다! 로그인 화면으로 이동합니다.");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-3xl animate-fade-in pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-3xl animate-fade-in pointer-events-none" style={{ animationDelay: "0.2s" }}></div>

      <div className="w-full max-w-md animate-slide-up z-10">
        <div className="glass dark:glass-dark rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2 text-foreground/90 tracking-tight">회원가입</h1>
            <p className="text-foreground/60">지금 TeamPLus와 함께하세요</p>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80 px-1">이름</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동" 
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80 px-1">이메일</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu" 
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80 px-1">비밀번호</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300"
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-[#4f46e5] hover:to-secondary text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5 transition-all duration-300"
              >
                {loading ? "가입 중..." : "가입하기"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-foreground/60">
            이미 계정이 있으신가요?{" "}
            <a href="/" className="font-semibold text-primary hover:text-[#4f46e5] transition-colors">
              로그인
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}