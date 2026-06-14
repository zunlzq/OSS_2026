"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  name: string;
  role: string;
  match: number;
  tech: string[];
  avatar: string;
}

export default function MatchResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const getInitials = (name: string) => {
    return name.slice(-2);
  };

  const loadTeam = async (userId: string) => {
    const { data: memberRecords, error: memberErr } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId);

    if (memberRecords && memberRecords.length > 0) {
      const teamId = memberRecords[0].team_id;

      const { data: allMembers, error: allErr } = await supabase
        .from("team_members")
        .select(`
          user_id,
          assigned_role,
          match_score,
          profiles (
            id,
            name,
            tech_stack
          )
        `)
        .eq("team_id", teamId);

      if (allMembers && allMembers.length > 0) {
        const formattedMembers: Member[] = allMembers.map((m: any) => {
          const profile = m.profiles;
          
          let techList: string[] = [];
          if (Array.isArray(profile.tech_stack)) {
            techList = profile.tech_stack
              .filter((t: any) => t.level === "상" || t.level === "중")
              .map((t: any) => `${t.skill} (${t.level})`);
          } else {
            techList = ["정보 없음"];
          }

          return {
            id: profile.id,
            name: profile.name,
            role: m.assigned_role,
            match: m.match_score || 90,
            tech: techList,
            avatar: getInitials(profile.name),
          };
        });
        
        setTeamMembers(formattedMembers);
        setLoading(false);
        return true;
      }
    }
    return false;
  };

  const performMatching = async (user: any) => {
    setMatching(true);

    const { data: userProfile, error: userProfileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userProfileErr || !userProfile) {
      alert("프로필 정보가 없습니다. 프로필을 먼저 입력해주세요.");
      router.push("/profile");
      return;
    }

    const userAvailable = userProfile.available_time || [];

    let { data: otherProfiles, error: otherErr } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id);

    if (otherErr) {
      alert("다른 프로필 조회 중 에러 발생: " + otherErr.message);
      setMatching(false);
      setLoading(false);
      return;
    }

    if (!otherProfiles || otherProfiles.length < 3) {
      alert("매칭 가능한 유저 데이터가 부족합니다.");
      setMatching(false);
      setLoading(false);
      return;
    }

    const validCandidates = (otherProfiles || []).filter((p: any) => {
      const pAvailable = p.available_time || [];
      const overlap = pAvailable.filter((t: string) => userAvailable.includes(t));
      return overlap.length >= 3;
    });

    if (validCandidates.length < 3) {
      alert("가용 시간이 3시간 이상 겹치는 유저가 부족합니다. 프로필에서 가용 시간을 더 많이 선택해보세요!");
      setMatching(false);
      setLoading(false);
      return;
    }

    const calculateDisplayScore = (person: any, role: string) => {
      const skills = Array.isArray(person.tech_stack) ? person.tech_stack : [];
      let requiredSkill = "";
      if (role === "기획자") requiredSkill = "기획";
      if (role === "프론트엔드 개발") requiredSkill = "프론트엔드";
      if (role === "백엔드 개발") requiredSkill = "백엔드";
      if (role === "디자이너") requiredSkill = "UI/UX";

      let level = "하";
      skills.forEach((s: any) => {
        let skillName = s.skill;
        if (skillName === "프론트") skillName = "프론트엔드";
        if (skillName === "백") skillName = "백엔드";
        if (skillName === requiredSkill) {
          level = s.level;
        }
      });

      if (level === "상") return person.pref_role === role ? 98 : 95;
      if (level === "중") return person.pref_role === role ? 88 : 85;
      return person.pref_role === role ? 78 : 70;
    };

    const getScore = (c: any, role: string) => {
      let score = 0;
      const skills = Array.isArray(c.tech_stack) ? c.tech_stack : [];
      let requiredSkill = "";
      if (role === "기획자") requiredSkill = "기획";
      if (role === "프론트엔드 개발") requiredSkill = "프론트엔드";
      if (role === "백엔드 개발") requiredSkill = "백엔드";
      if (role === "디자이너") requiredSkill = "UI/UX";

      skills.forEach((s: any) => {
        let skillName = s.skill;
        if (skillName === "프론트") skillName = "프론트엔드";
        if (skillName === "백") skillName = "백엔드";

        if (skillName === requiredSkill) {
          if (s.level === "상") score += 15;
          if (s.level === "중") score += 6;
          if (s.level === "하") score += 1;
        }
      });
      if (c.pref_role === role) {
        if (c.id === userProfile.id) score += 1000;
        else score += 5;
      }
      return score;
    };

    const targetRoles = ["기획자", "프론트엔드 개발", "백엔드 개발", "디자이너"];
    
    const selectedCandidateIds = new Set<string>();
    const candidates: any[] = [];
    
    targetRoles.forEach(role => {
      const sortedForRole = [...validCandidates].sort((a, b) => getScore(b, role) - getScore(a, role));
      const topForRole = sortedForRole.slice(0, 5);
      topForRole.forEach(c => {
        if (!selectedCandidateIds.has(c.id)) {
          selectedCandidateIds.add(c.id);
          candidates.push(c);
        }
      });
    });

    let bestScenario: any = null;
    let maxTotalScore = -1;

    const permute = (arr: any[]): any[][] => {
      if (arr.length === 0) return [[]];
      const result: any[][] = [];
      for (let i = 0; i < arr.length; i++) {
        const rest = permute(arr.slice(0, i).concat(arr.slice(i + 1)));
        for (const p of rest) {
          result.push([arr[i], ...p]);
        }
      }
      return result;
    };

    const rolePermutations = permute(targetRoles);

    const getCombinations = (arr: any[], size: number) => {
      const result: any[][] = [];
      const f = (prefix: any[], remaining: any[]) => {
        if (prefix.length === size) {
          result.push(prefix);
          return;
        }
        for (let i = 0; i < remaining.length; i++) {
          f([...prefix, remaining[i]], remaining.slice(i + 1));
        }
      };
      f([], arr);
      return result;
    };

    const candidateCombinations = getCombinations(candidates, 3);

    for (const combo of candidateCombinations) {
      const teamOf4 = [userProfile, ...combo];
      
      for (const roles of rolePermutations) {
        let currentScore = 0;
        let selectedForScenario: any[] = [];
        
        for (let i = 0; i < 4; i++) {
           const person = teamOf4[i];
           const role = roles[i];
           currentScore += getScore(person, role);
           selectedForScenario.push({ ...person, assignedRole: role });
        }
        
        if (currentScore > maxTotalScore) {
           maxTotalScore = currentScore;
           
           const userAssignment = selectedForScenario.find(s => s.id === userProfile.id);
           const otherMembers = selectedForScenario.filter(s => s.id !== userProfile.id);
           
           bestScenario = {
             userRole: userAssignment.assignedRole,
             members: otherMembers
           };
        }
      }
    }

    if (!bestScenario) {
      alert("팀을 구성할 충분한 유저가 없습니다.");
      setMatching(false);
      setLoading(false);
      return;
    }

    const finalUserRole = bestScenario.userRole;
    const chosenCandidates = bestScenario.members;

    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .insert([{ project_info: "오픈소스 프로젝트 팀 #4" }])
      .select()
      .single();

    if (teamErr || !team) {
      alert("팀 생성 실패: " + teamErr?.message);
      setMatching(false);
      setLoading(false);
      return;
    }

    const inserts = [
      {
        team_id: team.id,
        user_id: user.id,
        assigned_role: finalUserRole,
        match_score: calculateDisplayScore(userProfile, finalUserRole),
      },
      ...chosenCandidates.map((c: any) => {
        return {
          team_id: team.id,
          user_id: c.id,
          assigned_role: c.assignedRole,
          match_score: calculateDisplayScore(c, c.assignedRole),
        };
      }),
    ];

    const { error: insertErr } = await supabase.from("team_members").insert(inserts);

    if (insertErr) {
      alert("팀원 등록 실패: " + insertErr.message);
    } else {
      const welcomeMessages = [
        {
          team_id: team.id,
          sender_id: chosenCandidates[0]?.id || user.id,
          content: '안녕하세요! 만나서 반갑습니다.'
        },
        {
          team_id: team.id,
          sender_id: chosenCandidates[1]?.id || user.id,
          content: '반갑습니다! 첫 회의 일정은 언제로 할까요?'
        }
      ];
      await supabase.from('chat_messages').insert(welcomeMessages);
      await loadTeam(user.id);
    }
    setMatching(false);
  };

  const handleRematch = async () => {
    if (!currentUser) return;
    setMatching(true);

    const { data: memberRecords } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", currentUser.id);

    if (memberRecords && memberRecords.length > 0) {
      const teamIds = [...new Set(memberRecords.map((r: any) => r.team_id))];
      for (const teamId of teamIds) {
        await supabase.from("team_members").delete().eq("team_id", teamId);
        await supabase.from("teams").delete().eq("id", teamId);
      }
    }

    await performMatching(currentUser);
  };

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert("로그인이 필요합니다.");
        router.push("/");
        return;
      }
      setCurrentUser(user);

      const hasTeam = await loadTeam(user.id);
      if (!hasTeam) {
        await performMatching(user);
      }
    }
    checkAuthAndLoad();
  }, [router]);

  if (loading || matching) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <div className="text-xl font-medium text-foreground/60 animate-pulse">
          {matching ? "최적의 팀원들을 매칭 중입니다..." : "팀 매칭 정보 로딩 중..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 relative overflow-hidden">
      <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl animate-fade-in pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl animate-fade-in pointer-events-none" style={{ animationDelay: "0.2s" }}></div>

      <div className="max-w-5xl mx-auto z-10 relative animate-slide-up">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full mb-4 px-4 text-sm font-medium border border-green-500/20">
            매칭 완료
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent pb-1">최적의 팀 매칭 결과</h1>
          <p className="text-foreground/60 mt-3">기술 스택과 스케줄을 바탕으로 최고의 조합을 찾았습니다.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="glass dark:glass-dark rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shadow-inner">
                    {member.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground/90">{member.name}</h3>
                    <p className="text-sm text-primary font-medium">{member.role}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-foreground/50 mb-1">매칭 점수</span>
                  <div className="flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-md text-xs font-bold border border-green-500/20">
                    {member.match}%
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-foreground/5">
                <div className="flex flex-wrap gap-2">
                  {member.tech.map(tech => (
                    <span key={tech} className="px-2 py-1 bg-foreground/5 text-foreground/70 rounded-md text-xs font-medium border border-foreground/10">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <button 
            onClick={handleRematch}
            className="px-8 py-3 rounded-xl border border-foreground/10 text-foreground/70 font-medium hover:bg-foreground/5 transition-colors"
          >
            다시 매칭하기
          </button>
          <a href="/workspace" className="bg-gradient-to-r from-primary to-secondary hover:from-[#4f46e5] hover:to-secondary text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center gap-2">
            워크스페이스 입장
          </a>
        </div>
      </div>
    </div>
  );
}

