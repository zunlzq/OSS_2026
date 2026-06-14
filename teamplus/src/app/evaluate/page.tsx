"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Teammate {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export default function EvaluatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<Teammate[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, { score: number; feedback: string; freeRider: boolean }>>({});

  const getInitials = (name: string) => {
    return name.slice(-2);
  };

  useEffect(() => {
    async function loadTeammates() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert("로그인이 필요합니다.");
        router.push("/");
        return;
      }
      setCurrentUser(user);

      // Get user's active team_id
      const { data: memberRecords, error: memberErr } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);

      if (memberErr || !memberRecords || memberRecords.length === 0) {
        alert("평가할 활성화된 팀이 없습니다.");
        router.push("/profile");
        return;
      }

      const tId = memberRecords[0].team_id;
      setTeamId(tId);

      // Fetch other team members
      const { data: allMembers, error: allErr } = await supabase
        .from("team_members")
        .select(`
          user_id,
          assigned_role,
          profiles (
            id,
            name
          )
        `)
        .eq("team_id", tId)
        .neq("user_id", user.id);

      if (allErr || !allMembers) {
        alert("팀원 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      const formattedMembers: Teammate[] = allMembers.map((m: any) => ({
        id: m.profiles.id,
        name: m.profiles.name,
        role: m.assigned_role,
        avatar: getInitials(m.profiles.name)
      }));

      setTeamMembers(formattedMembers);

      const initialEvals: Record<string, { score: number; feedback: string; freeRider: boolean }> = {};
      formattedMembers.forEach(member => {
        initialEvals[member.id] = { score: 5, feedback: "", freeRider: false };
      });
      setEvaluations(initialEvals);
      setLoading(false);
    }

    loadTeammates();
  }, [router]);

  const handleUpdate = (id: string, field: string, value: any) => {
    setEvaluations(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !teamId) return;
    setSubmitting(true);

    try {
      const inserts = teamMembers.map(member => ({
        evaluator_id: currentUser.id,
        evaluatee_id: member.id,
        team_id: teamId,
        score: evaluations[member.id].score,
        feedback: evaluations[member.id].feedback || "",
        is_free_rider: evaluations[member.id].freeRider
      }));

      const { error: evalErr } = await supabase.from("evaluations").insert(inserts);
      if (evalErr) throw evalErr;

      await supabase.from("teams").update({ status: "completed" }).eq("id", teamId);
      await supabase.from("team_members").delete().eq("team_id", teamId);

      alert("평가가 성공적으로 제출되었으며, 팀 프로젝트가 종료되었습니다! 소중한 피드백 감사합니다.");
      router.push("/profile");
    } catch (err: any) {
      alert("평가 제출 오류: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl font-medium text-foreground/60 animate-pulse">팀원 정보 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 relative overflow-hidden">
      <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl animate-fade-in pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl animate-fade-in pointer-events-none" style={{ animationDelay: "0.2s" }}></div>

      <div className="max-w-4xl mx-auto z-10 relative animate-slide-up">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 text-primary rounded-full mb-4 px-4 text-sm font-medium border border-primary/20">
            프로젝트 종료
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent pb-1">동료 평가</h1>
          <p className="text-foreground/60 mt-3">신뢰할 수 있는 커뮤니티를 위해 팀원을 평가해주세요. 피드백은 익명으로 처리됩니다.</p>
        </header>

        {teamMembers.length === 0 ? (
          <div className="glass dark:glass-dark rounded-3xl p-8 text-center text-foreground/60">
            평가할 다른 팀원이 없습니다.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {teamMembers.map((member, idx) => (
              <div key={member.id} className="glass dark:glass-dark rounded-3xl p-6 shadow-xl relative overflow-hidden" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shadow-inner">
                      {member.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground/90">{member.name}</h3>
                      <p className="text-sm text-primary font-medium">{member.role}</p>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-sm font-medium text-foreground/80">기여도 점수</label>
                        <span className="text-sm font-bold text-primary">{evaluations[member.id]?.score} / 10</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" 
                        value={evaluations[member.id]?.score || 5}
                        onChange={(e) => handleUpdate(member.id, "score", parseInt(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id={`freerider-${member.id}`}
                        checked={evaluations[member.id]?.freeRider || false}
                        onChange={(e) => handleUpdate(member.id, "freeRider", e.target.checked)}
                        className="w-4 h-4 text-secondary rounded border-foreground/20 focus:ring-secondary accent-secondary"
                      />
                      <label htmlFor={`freerider-${member.id}`} className="text-sm text-secondary font-medium">무임승차 신고 (페널티 적용)</label>
                    </div>

                    <div>
                      <textarea 
                        placeholder="건설적인 피드백을 남겨주세요..."
                        value={evaluations[member.id]?.feedback || ""}
                        onChange={(e) => handleUpdate(member.id, "feedback", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-foreground/10 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all duration-300 resize-none h-20 text-sm"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-8 flex justify-end">
              <button 
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-primary to-secondary hover:from-[#4f46e5] hover:to-secondary text-white font-semibold py-3.5 px-10 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:transform-none"
              >
                {submitting ? "제출 중..." : "평가 제출하기"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
