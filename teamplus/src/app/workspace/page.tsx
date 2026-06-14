"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface MemberMapInfo {
  name: string;
  role: string;
  avatar: string;
}

export default function WorkspacePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string>("오픈소스 프로젝트 팀");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, MemberMapInfo>>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  const [commonTime, setCommonTime] = useState<string>("");
  const [commonTimeSub, setCommonTimeSub] = useState<string>("팀원 100%가 참석 가능합니다.");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return name.slice(-2);
  };

  const fetchMessages = async (tId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, content, created_at, sender_id")
      .eq("team_id", tId)
      .order("created_at", { ascending: true });

    if (data && !error) {
      setMessages(data);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    async function loadWorkspaceData() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert("로그인이 필요합니다.");
        router.push("/");
        return;
      }
      setUserId(user.id);

      const { data: memberRecords, error: memberErr } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);

      if (memberErr || !memberRecords || memberRecords.length === 0) {
        alert("소속된 팀이 없습니다. 팀 매칭을 진행해주세요.");
        router.push("/match");
        return;
      }

      const tId = memberRecords[0].team_id;
      setTeamId(tId);

      const { data: teamDetail } = await supabase
        .from("teams")
        .select("project_info")
        .eq("id", tId)
        .single();
      if (teamDetail) {
        setTeamName(teamDetail.project_info);
      }

      const { data: allMembers, error: allErr } = await supabase
        .from("team_members")
        .select(`
          user_id,
          assigned_role,
          profiles (
            id,
            name,
            available_time
          )
        `)
        .eq("team_id", tId);

      if (allErr || !allMembers) {
        alert("팀원 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      setTeamMembers(allMembers);

      const newMemberMap: Record<string, MemberMapInfo> = {};
      allMembers.forEach((m: any) => {
        const profile = m.profiles;
        newMemberMap[m.user_id] = {
          name: profile.name,
          role: m.assigned_role,
          avatar: getInitials(profile.name)
        };
      });
      setMemberMap(newMemberMap);

      const memberSchedules = allMembers.map((m: any) => m.profiles?.available_time || []);
      let intersection: string[] = [];
      if (memberSchedules.length > 0) {
        intersection = memberSchedules[0].filter((time: string) =>
          memberSchedules.every((sched: string[]) => sched.includes(time))
        );
      }

      if (intersection.length === 0) {
        setCommonTime("공통 가능 시간 없음");
        setCommonTimeSub("팀원 간 겹치는 시간대가 없습니다. 서로 프로필에서 시간을 조율해주세요.");
      } else {
        const dayMap: Record<string, number[]> = {};
        intersection.forEach(slot => {
          const parts = slot.split('-');
          if (parts.length === 2) {
            const day = parts[0];
            const hour = parseInt(parts[1]);
            if (!dayMap[day]) dayMap[day] = [];
            dayMap[day].push(hour);
          }
        });

        const formattedRanges: string[] = [];
        Object.keys(dayMap).forEach(day => {
          const hoursList = dayMap[day].sort((a, b) => a - b);
          let start = hoursList[0];
          let prev = hoursList[0];
          
          for (let i = 1; i <= hoursList.length; i++) {
            const current = hoursList[i];
            if (current !== prev + 1 || i === hoursList.length) {
              const end = prev + 1;
              const dayFullName = day === "월" ? "월요일" : day === "화" ? "화요일" : day === "수" ? "수요일" : day === "목" ? "목요일" : "금요일";
              formattedRanges.push(`${dayFullName} ${start}:00 - ${end}:00`);
              start = current;
            }
            prev = current;
          }
        });

        setCommonTime(formattedRanges.join(", "));
        setCommonTimeSub("팀원 100%가 참석 가능합니다.");
      }

      await fetchMessages(tId);
      setLoading(false);
    }

    loadWorkspaceData();
  }, [router]);

  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel(`chat:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          fetchMessages(teamId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !teamId || !userId) return;

    const { error } = await supabase.from("chat_messages").insert({
      team_id: teamId,
      sender_id: userId,
      content: input.trim()
    });

    if (error) {
      alert("전송 실패: " + error.message);
    } else {
      setInput("");
      fetchMessages(teamId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl font-medium text-foreground/60 animate-pulse">워크스페이스 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background p-4 flex flex-col relative overflow-hidden">
      <header className="glass dark:glass-dark rounded-2xl p-4 mb-4 shadow-sm flex justify-between items-center z-10 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground/90">{teamName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-xs text-foreground/60">{teamMembers.length}명 접속 중</span>
          </div>
        </div>
        <div className="flex gap-2">
          {teamMembers.map((m: any) => (
            <div 
              key={m.user_id} 
              title={`${m.profiles?.name} (${m.assigned_role})`}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-xs font-bold ring-2 ring-background shadow-sm"
            >
              {getInitials(m.profiles?.name || "유저")}
            </div>
          ))}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 z-10">
        <div className="lg:col-span-2 glass dark:glass-dark rounded-3xl shadow-xl overflow-hidden flex flex-col relative">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20"></div>
          
          <div className="p-4 border-b border-foreground/5 bg-foreground/5 backdrop-blur-md">
            <h2 className="font-semibold text-foreground/80 flex items-center gap-2">팀 채팅</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-foreground/[0.02]">
            {messages.map((msg, i) => {
              const sender = memberMap[msg.sender_id] || { name: "알 수 없음", role: "팀원", avatar: "팀" };
              const isMe = msg.sender_id === userId;
              const timeStr = msg.created_at 
                ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "방금 전";

              return (
                <div key={msg.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-slide-up`}>
                  <span className="text-[10px] text-foreground/40 mb-1 px-1">{sender.name} ({sender.role}) • {timeStr}</span>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] shadow-sm ${isMe ? "bg-primary text-white rounded-tr-sm" : "bg-white dark:bg-zinc-800 text-foreground/90 border border-foreground/5 rounded-tl-sm"}`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-foreground/5 bg-white/50 dark:bg-black/20">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="메시지를 입력하세요..." 
                className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-foreground/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
              />
              <button type="submit" className="px-6 rounded-xl bg-primary hover:bg-[#4f46e5] text-white font-medium transition-colors shadow-md shadow-primary/20">전송</button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex-1 glass dark:glass-dark rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            <h2 className="font-semibold text-foreground/80 mb-4 flex items-center gap-2">공통 가능 시간</h2>
            
            <div className="flex-1 bg-white/40 dark:bg-black/20 rounded-xl border border-foreground/10 p-4 flex flex-col justify-center items-center text-center">
              <h3 className="font-bold text-foreground/90 text-lg whitespace-pre-wrap">{commonTime}</h3>
              <p className="text-sm text-foreground/60 mt-1 mb-4">{commonTimeSub}</p>
              <button 
                onClick={() => alert(`확정된 일정: ${commonTime}`)}
                disabled={!commonTime || commonTime === "공통 가능 시간 없음"}
                className="px-4 py-2 bg-secondary text-white text-sm font-medium rounded-lg shadow-md hover:bg-[#d9468c] transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                일정 등록하기
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-foreground/5 space-y-3">
              <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">다가오는 일정</h3>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary font-bold leading-none">
                  <span className="text-[10px] uppercase">회의</span>
                  <span>공통</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/80">킥오프 미팅</p>
                  <p className="text-xs text-foreground/50">{commonTime || "미정"}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="shrink-0 glass dark:glass-dark rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <h2 className="font-semibold text-foreground/80 mb-3 flex items-center gap-2">프로젝트 진행 단계</h2>
            <div className="w-full bg-foreground/10 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" style={{ width: "20%" }}></div>
            </div>
            <div className="flex justify-between text-xs text-foreground/50">
              <span>기획 단계</span>
              <a href="/evaluate" className="text-primary hover:underline font-medium">프로젝트 종료 및 평가하기</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
