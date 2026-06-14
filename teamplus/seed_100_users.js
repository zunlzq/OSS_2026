const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

const firstNames = ['민준', '서준', '도윤', '예준', '시우', '하준', '지호', '주원', '지훈', '건우', '서연', '서윤', '지우', '서현', '하은', '하윤', '민서', '지유', '윤서', '지민', '채원', '수아', '지아', '다은', '은우', '선우', '서진', '연우', '유준', '정우', '승우', '승민', '유찬', '지환', '윤우', '다인', '아린', '소윤', '시아', '서아', '아윤', '나은', '유진', '수민', '지원'];
const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];

const roles = ['기획자', '프론트엔드 개발', '백엔드 개발', '디자이너'];
const levels = ['상', '중', '하'];
const techMap = {
  '기획자': '기획',
  '프론트엔드 개발': '프론트엔드',
  '백엔드 개발': '백엔드',
  '디자이너': 'UI/UX'
};
const allTechs = ['기획', '프론트엔드', '백엔드', 'UI/UX'];

const days = ['월', '화', '수', '목', '금'];
const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const generateRandomName = () => {
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
  return ln + fn;
};

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const mockUsers = [];

for (let i = 0; i < 100; i++) {
  const name = generateRandomName();
  const pref_role = roles[Math.floor(Math.random() * roles.length)];

  const tech_stack = [];
  const selectedTechs = new Set();
  
  const mainTech = techMap[pref_role];
  allTechs.forEach(skill => {
    let level;
    if (skill === mainTech) {
      // 선호 역할의 메인 스킬은 상 또는 중으로 배정
      level = Math.random() < 0.6 ? '상' : '중';
    } else {
      // 나머지 스킬은 상/중/하 무작위 배정
      level = levels[Math.floor(Math.random() * levels.length)];
    }
    tech_stack.push({ skill, level });
  });

  const available_time = [];
  const numSlots = Math.floor(Math.random() * 16) + 15;
  for (let s = 0; s < numSlots; s++) {
    const day = days[Math.floor(Math.random() * days.length)];
    const hour = hours[Math.floor(Math.random() * hours.length)];
    const slot = day + '-' + hour;
    if (!available_time.includes(slot)) available_time.push(slot);
  }

  mockUsers.push({
    id: uuidv4(),
    name: name,
    email: 'mockuser' + i + '@example.com',
    pref_role: pref_role,
    tech_stack: tech_stack,
    available_time: available_time
  });
}

async function seed() {
  await supabase.from('profiles').delete().like('email', 'mockuser%');
  console.log('Cleared mock users');
  console.log('Inserting ' + mockUsers.length + ' users into profiles table...');
  for (let i = 0; i < mockUsers.length; i += 50) {
    const chunk = mockUsers.slice(i, i + 50);
    const { data, error } = await supabase.from('profiles').insert(chunk);
    if (error) console.error('Error inserting chunk ' + i + ':', error);
    else console.log('Inserted chunk ' + i + ' to ' + (i + 50));
  }
  console.log('Seeding complete.');
}

seed();
