"use client";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<Record<string, string>>({});
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  
  const days = ["월", "화", "수", "목", "금"];
  const hours = Array.from({length: 12}, (_, i) => i + 9);
  const [schedule, setSchedule] = useState<Set<string>>(new Set());

  const { previewRole, hasTie } = useMemo(() => {
    const skillScores: Record<string, number> = { "상": 3, "중": 2, "하": 1 };
    const roleMapping: Record<string, string> = { "프론트엔드": "프론트엔드 개발", "백엔드": "백엔드 개발", "기획": "기획자", "UI/UX": "디자이너" };
    const reverseRoleMapping: Record<string, string> = { "프론트엔드 개발": "프론트엔드", "백엔드 개발": "백엔드", "기획자": "기획", "디자이너": "UI/UX" };
    const priority = ["프론트엔드", "백엔드", "기획", "UI/UX"];

    let maxScore = -1;
    let bestSkills: string[] = [];

    for (const skill of priority) {
      const level = selectedSkills[skill];
      const score = level ? skillScores[level] : 0;
      if (score > maxScore) {
        maxScore = score;
        bestSkills = [skill];
      } else if (score === maxScore && maxScore > 0) {
        bestSkills.push(skill);
      }
    }

    if (bestSkills.length === 0) return { previewRole: null, hasTie: false };

    const isTie = bestSkills.length > 1;
    let finalSkill = bestSkills[0];
    if (isTie && selectedRole) {
      const preferredSkill = reverseRoleMapping[selectedRole];
      if (bestSkills.includes(preferredSkill)) {
        finalSkill = preferredSkill;
      }
    }

    return { previewRole: roleMapping[finalSkill], hasTie: isTie };
  }, [selectedSkills, selectedRole]);

  useEffect(() => {
    const skillScores: Record<string, number> = { "상": 3, "중": 2, "하": 1 };
    const roleMapping: Record<string, string> = { "프론트엔드": "프론트엔드 개발", "백엔드": "백엔드 개발", "기획": "기획자", "UI/UX": "디자이너" };
    const priority = ["프론트엔드", "백엔드", "기획", "UI/UX"];

    let maxScore = -1;
    let bestSkills: string[] = [];

    for (const skill of priority) {
      const level = selectedSkills[skill];
      const score = level ? skillScores[level] : 0;
      if (score > maxScore) {
        maxScore = score;
        bestSkills = [skill];
      } else if (score === maxScore && maxScore > 0) {
        bestSkills.push(skill);
      }
    }

    if (bestSkills.length === 1) {
      const autoRole = roleMapping[bestSkills[0]];
      setSelectedRole(autoRole);
    }
  }, [selectedSkills]);

  useEffect(() => {
    async function checkAuthAndFetchProfile() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert("로그인이 필요합니다.");
        router.push("/");
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email || "");
      setUserName(user.user_metadata?.name || "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile && !profileError) {
        setHasProfile(true);
        if (profile.name) {
          setUserName(profile.name);
        }
        setSelectedRole(profile.pref_role || null);
        if (profile.available_time) {
          setSchedule(new Set(profile.available_time));
        }
        if (profile.tech_stack && Array.isArray(profile.tech_stack)) {
          const skills: Record<string, string> = {};
          profile.tech_stack.forEach((item: any) => {
            if (item && item.skill && item.level) {
              skills[item.skill] = item.level;
            }
          });
          setSelectedSkills(skills);
        }
      } else {
        setHasProfile(false);
      }
      setLoading(false);
    }
    checkAuthAndFetchProfile();
  }, [router]);

  const toggleTimeSlot = (day: string, hour: number) => {
    const key = `${day}-${hour}`;
    const newSchedule = new Set(schedule);
    if (newSchedule.has(key)) {
      newSchedule.delete(key);
    } else {
      newSchedule.add(key);
    }
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!selectedRole) {
      alert("선호 역할을 선택해주세요.");
      return;
    }
    
    const skillScores: Record<string, number> = { "상": 3, "중": 2, "하": 1 };
    const roleMapping: Record<string, string> = { "프론트엔드": "프론트엔드 개발", "백엔드": "백엔드 개발", "기획": "기획자", "UI/UX": "디자이너" };
    const reverseRoleMapping: Record<string, string> = { "프론트엔드 개발": "프론트엔드", "백엔드 개발": "백엔드", "기획자": "기획", "디자이너": "UI/UX" };
    const priority = ["프론트엔드", "백엔드", "기획", "UI/UX"];
    
    let maxScore = -1;
    let bestSkills: string[] = [];

    for (const skill of priority) {
      const level = selectedSkills[skill];
      const score = level ? skillScores[level] : 0;
      if (score > maxScore) {
        maxScore = score;
        bestSkills = [skill];
      } else if (score === maxScore) {
        bestSkills.push(skill);
      }
    }

    let finalSkill = bestSkills[0];
    if (bestSkills.length > 1) {
      const preferredSkill = reverseRoleMapping[selectedRole];
      if (bestSkills.includes(preferredSkill)) {
        finalSkill = preferredSkill;
      }
    }

    const calculatedRole = roleMapping[finalSkill];

    setSaving(true);

    const techStackArray = Object.entries(selectedSkills).map(([skill, level]) => ({
      skill,
      level,
    }));

    const availableTimeArray = Array.from(schedule);

    let error;
    if (hasProfile) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: userName,
          tech_stack: techStackArray,
          pref_role: calculatedRole,
          available_time: availableTimeArray,
        })
        .eq("id", userId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          name: userName,
          email: userEmail,
          tech_stack: techStackArray,
          pref_role: calculatedRole,
          available_time: availableTimeArray,
        });
      error = insertError;
    }

    setSaving(false);

    if (error) {
      alert("프로필 저장 실패: " + error.message);
    } else {
      const { data: memberRecords } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId);
      if (memberRecords && memberRecords.length > 0) {
        const teamIds = [...new Set(memberRecords.map((r: any) => r.team_id))];
        for (const teamId of teamIds) {
          await supabase.from("team_members").delete().eq("team_id", teamId);
          await supabase.from("teams").delete().eq("id", teamId);
        }
      }
      router.push("/match");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl font-medium text-foreground/60 animate-pulse">프로필 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl animate-fade-in pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl animate-fade-in pointer-events-none" style={{ animationDelay: "0.2s" }}></div>

      <div className="max-w-6xl mx-auto z-10 relative">
        <header className="mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block">프로필 완성하기</h1>
          <p className="text-foreground/60 mt-2">기술 스택과 가용 시간을 바탕으로 최적의 팀을 찾아드립니다.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8 animate-slide-up">
            <div className="glass dark:glass-dark rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              <h2 className="text-xl font-semibold mb-4 text-foreground/90">기본 정보</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">이름</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-foreground/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 text-sm"
                  placeholder="이름을 입력하세요"
                />
              </div>
            </div>

            <div className="glass dark:glass-dark rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              <h2 className="text-xl font-semibold mb-4 text-foreground/90">기술 스택</h2>
              
              <div className="space-y-4">
                {["프론트엔드", "백엔드", "기획", "UI/UX"].map((skill) => (
                  <div key={skill} className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">{skill}</label>
                    <div className="flex gap-2">
                      {["상", "중", "하"].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSelectedSkills({...selectedSkills, [skill]: level})}
                          className={`flex-1 py-2 text-sm rounded-lg border transition-all duration-300 ${selectedSkills[skill] === level ? "bg-primary/10 border-primary text-primary font-semibold" : "border-foreground/10 text-foreground/60 hover:bg-foreground/5"}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass dark:glass-dark rounded-3xl p-6 shadow-xl relative overflow-hidden" style={{ animationDelay: "0.1s" }}>
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              <h2 className="text-xl font-semibold mb-4 text-foreground/90">선호 역할 <span className="text-xs text-foreground/40 font-normal">(동점 시 우선 배정)</span></h2>
              {hasTie && (
                <p className="text-xs text-amber-500 mb-3">동점입니다! 아래에서 원하는 역할을 선택하세요.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {["기획자", "프론트엔드 개발", "백엔드 개발", "디자이너"].map((role) => (
                  <button
                    key={role}
                    onClick={() => hasTie && setSelectedRole(role)}
                    disabled={!hasTie}
                    className={`p-3 text-sm rounded-xl border text-center transition-all duration-300 ${selectedRole === role ? "bg-secondary/10 border-secondary text-secondary font-semibold" : "border-foreground/10 text-foreground/60"} ${hasTie ? "hover:bg-foreground/5 cursor-pointer" : "cursor-default opacity-70"}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              {previewRole && (
                <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2">
                  <span className="text-xs text-foreground/50">배정될 역할:</span>
                  <span className="text-sm font-semibold text-primary">{previewRole}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="glass dark:glass-dark rounded-3xl p-6 shadow-xl relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground/90">가용 시간표</h2>
                  <p className="text-sm text-foreground/50 mt-1">팀 회의가 가능한 시간을 모두 선택해주세요.</p>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                <div className="min-w-[600px] border border-foreground/10 rounded-xl overflow-hidden bg-white/30 dark:bg-black/10 backdrop-blur-sm">
                  <div className="grid grid-cols-6 border-b border-foreground/10 bg-foreground/5">
                    <div className="p-3 text-center text-xs font-semibold text-foreground/60 border-r border-foreground/10">시간</div>
                    {days.map(day => (
                      <div key={day} className="p-3 text-center text-sm font-medium text-foreground/80 border-r last:border-0 border-foreground/10">{day}</div>
                    ))}
                  </div>
                  
                  <div className="divide-y divide-foreground/5">
                    {hours.map(hour => (
                      <div key={hour} className="grid grid-cols-6 group">
                        <div className="p-2 text-center text-xs text-foreground/40 border-r border-foreground/10 bg-foreground/5">
                          {hour}:00
                        </div>
                        {days.map(day => {
                          const isSelected = schedule.has(`${day}-${hour}`);
                          return (
                            <div 
                              key={`${day}-${hour}`}
                              onClick={() => toggleTimeSlot(day, hour)}
                              className={`border-r last:border-0 border-foreground/10 cursor-pointer transition-colors duration-200 ${isSelected ? "bg-primary/60 hover:bg-primary/70" : "hover:bg-foreground/5"}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-[#4f46e5] hover:to-secondary text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center gap-2 disabled:opacity-70"
                >
                  {saving ? "저장 중..." : "저장 및 팀 찾기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
