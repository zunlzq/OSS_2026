# 1. Conceptualization

TeamPLus – 팀플 매칭 및 역할 분배 시스템


## [ Revision History ]

| Revision date | Version # | Description | Author |
|---|---|---|---|
| 2026/03/25 | 1.0.0 | 초안 |  |

---

## Contents

1. Business purpose
2. System context diagram
3. Use case list
4. Concept of operation
5. Problem statement
6. Glossary
7. References

---

## 1. Business Purpose

대학교에서 팀프로젝트는 협업 능력을 기르는 중요한 과정이지만, 실제로는 다양한 문제가 발생한다. 대표적으로 팀원 간 실력 차이, 역할 분배의 불균형, 일정 조율의 어려움, 그리고 무임승차 문제가 있다. 이러한 문제들은 프로젝트의 완성도를 떨어뜨리고 팀원 간 갈등을 유발한다. 또한, 팀을 구성하는 과정 자체에서도 문제가 발생한다. 일부 학생들은 함께 팀을 구성할 친구가 없거나, 원하는 팀을 찾지 못해 원하지 않는 방식으로 팀에 배정되는 경우가 많다. 이러한 상황은 프로젝트 참여 의욕을 저하시킬 뿐만 아니라 협업의 효율성에도 부정적인 영향을 미친다. 특히 팀 구성 단계에서의 문제는 이후 역할 분배, 일정 조율, 협업 과정 전반에 걸쳐 영향을 미치기 때문에 팀을 잘못 구성할경우 첫 단추를 잘못 끼우는 꼴이 된다. 그래서 생각해본것이 각자의 능력을 기록하면 알아서 최적의 팀을 구성해주는 시스템을 구축해 보고자 하였다. 이런 이유에서 어떤 프로젝트인지 잘 알수있도록 TeamPLus라는 “Team Project + us  Team Plus”라는 두가지 의미를 담고 있는 이름을 지어주었다.

본 기능의 목적은 사용자들이 보다 효율적이고 인맥에 구애받지 않고 공정하게 팀 프로젝트를 진행할 수 있도록 하는 것이다. 기존의 팀 프로젝트에서는 팀 구성, 역할 분배, 일정 조율 등의 과정에서 다양한 문제가 발생하며, 특히 개인의 능력이나 선호가 충분히 반영되지 않아 협업의 효율성이 저하되는 경우가 많다. 이를 해결하기 위해 본 시스템은 사용자들이 입력한 정보를 기반으로 팀을 자동으로 구성해주며, 각 팀원에게 적절한 역할을 배정함으로써 협업 과정을 최적화하고자 한다. 또한 사용자 간 원활한 의사소통과 일정팀플과정 관리 기능을 제공하여 프로젝트 진행 전반을 수월하게 진행하게 하하는 것을 목표로 한다.  

---

## 2. System Context Diagram

- Login (로그인)  
- Register (회원가입)   
- View Profile (프로필 조회)  
- Update Profile (프로필 수정)  
- Input Profile (사용자 정보 입력)  
- Match Team (팀 매칭)  
- Join Team (팀 참여)  
- Leave Team (팀 탈퇴)  
- Assign Role (역할 분배)  
- Modify Role (역할 변경)  
- Manage Schedule (일정 관리)  
- View Schedule (일정 조회)  
- Chat (채팅 기능)  
- Evaluate Member (팀원 평가)  
- View Evaluation (평가 조회)  
- Report Member (팀원 신고)  

---

## 3. Use Case List

### 1) Register Member  
Actor User  
Description 사용자는 시스템 이용을 위해 회원가입을 한다.  

### 2) Login  
Actor User  
Description 등록된 사용자는 로그인하여 시스템 기능을 이용한다.  

### 3) Input Profile  
Actor User  
Description 사용자는 자신의 능력, 선호 역할, 가능한 시간을 입력한다.  

### 4) Match Team  
Actor System  
Description 시스템은 사용자 정보를 기반으로 팀을 자동으로 구성한다.  

### 5) Assign Role  
Actor System  
Description 팀 구성 후 각 팀원에게 역할을 자동으로 배정한다.  

### 6) Manage Schedule  
Actor User  
Description 팀원들은 가능한 시간을 공유하고 일정을 조율한다.  

### 7) Chat  
Actor User  
Description 팀원 간 채팅을 통해 소통한다.  

### 8) Evaluate Member  
Actor User  
Description 프로젝트 종료 후 팀원들을 평가한다.  

---

## 4. Concept of Operation

### 1) Register Member  
Purpose  
사용자가 시스템을 이용할 수 있도록 계정을 생성하고, 이후 다양한 기능을 사용할 수 있는 권한을 제공하는 것을 목적으로 함.  

Approach  
사용자는 이름, 이메일, 비밀번호 등의 정보를 입력하여 회원가입을 진행하며, 입력된 정보는 데이터베이스에 저장된다.  

Dynamics  
처음 시스템을 사용하는 경우  

Goals  
사용자가 시스템에 접근 가능하도록 한다  

---

### 2) Login  
Purpose  
등록된 사용자를 인증하여 시스템의 기능을 안전하게 이용할 수 있도록 하는 것이다.

Approach  
사용자가 입력한 ID와 비밀번호를 데이터베이스와 비교하여 일치 여부를 확인한다.  

Dynamics  
사용자가 시스템을 이용하려는 경우  

Goals  
인증된 사용자에게만 시스템 기능 제공  

---

### 3) Input Profile  
Purpose  
사용자의 능력, 선호 역할, 일정 정보를 수집하여 팀 매칭과 역할 분배의 정확도를 높이는 것을 목적으로 한다.  

Approach  
사용자는 자신의 스킬 수준, 역할 선호도, 시간표 등을 입력한다.  

Dynamics  
팀 매칭 이전 단계  

Goals  
정확한 팀 구성 및 역할 배정  

---

### 4) Match Team  
Purpose  
사용자들의 다양한 정보를 기반으로 균형 잡힌 팀을 자동으로 구성하여 팀 프로젝트 수행의 효율성을 높이는 것을 목적으로 함.  

Approach  
사용자의 능력, 선호도, 일정 등을 고려한 알고리즘을 통해 팀을 자동으로 구성한다.  

Dynamics  
팀 구성이 필요한 경우  

Goals  
공정하고 효율적인 팀 구성  

---

### 5) Assign Role  
Purpose  
각 팀원에게 적절한 역할을 배정하여 협업 과정에서의 불균형을 최소화하는 것을 목적으로 한다.  

Approach  
사용자의 능력과 선호도를 기반으로 역할을 자동으로 배정한다.  

Dynamics  
팀 구성 완료 후  

Goals  
공정한 역할 분배  

---

### 6) Manage Schedule  
Purpose  
팀원 간 일정 조율을 통해 프로젝트 진행의 효율성을 높이는 것을 목적으로 한다.  

Approach  
각 팀원의 가능 시간을 입력 받아 공통 시간을 계산한다.  

Dynamics  
다음 모임 일정 설정 시  

Goals  
효율적인 일정 관리  

---

### 7) Chat  
Purpose  
팀원 간 원활한 의사소통을 지원하는 것을 목적으로 한다.  

Approach  
실시간 채팅 기능을 제공한다.  

Dynamics  
프로젝트 진행 중  

Goals  
협업 효율 증가  

---

### 8) Evaluate Member  
Purpose  
팀원 간 기여도를 평가하여 공정한 협업 문화를 조성하는 것을 목적으로 한다.  

Approach  
프로젝트 종료 후 팀원들이 서로를 평가한다.  

Dynamics  
프로젝트 완료 시  

Goals  
공정한 평가 및 데이터 활용  

---

## 5. Problem Statement

### Problem #1 – Difficulty in Team Formation  
팀을 구성할 친구가 부족하거나 능력에 맞지않는 팀, 혹은 능력에 맞는 팀을 찾지 못할 수 있다.

### Problem #2 – Matching Accuracy  
자동 매칭이 실제 능력을 정확히 반영하지 못해 잘못된 역할을 배정받을 수 있다.  

### Problem #3 – Free Rider Issue  
일부 팀원의 무임승차 문제 발생 가능성이 있다.

### Problem #4 – Data Reliability  
사용자가 정보를 부정확하게 입력할 가능성이 있다.

### Problem #5 – Schedule Conflict  
공통 시간이 없거나 찾기 어려울경우 스케쥴을 잡지 못할 수 있다.



---

## 6. Glossary  

| Term | Description |
|------|------------|
| User | 시스템 사용자 |
| Team | 프로젝트를 위해 구성된 그룹 |
| Matching | 사용자를 기반으로 팀을 자동 구성하는 과정 |
| Role | 팀 내에서 수행하는 역할 |
| Schedule | 프로젝트 진행을 위한 일정 계획 |
| Free Rider | 팀 프로젝트에서 기여하지 않는 구성원 |
| Evaluation | 팀원 간 기여도를 평가하는 과정 |
| Profile | 사용자의 능력, 선호도, 일정 등의 정보 |
| Chat | 팀원 간 의사소통을 위한 메시지 기능 |
| Algorithm | 팀 매칭 및 역할 분배에 사용되는 로직 |
| Task | 팀 프로젝트에서 수행해야 하는 개별 작업 |

## 7. References
