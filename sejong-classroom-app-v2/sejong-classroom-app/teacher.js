// 학생 화면(app.js)과 동일한 Supabase URL 및 anon public key를 입력하세요.
const SUPABASE_URL="YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY";
const BUCKET="worksheets";
const ready=!SUPABASE_URL.includes("YOUR_")&&!SUPABASE_ANON_KEY.includes("YOUR_");
const db=ready?window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
const $=id=>document.getElementById(id);let allRows=[];
if(!ready)$("loginStatus").textContent="teacher.js에 Supabase URL과 anon key를 설정하세요.";
$("login").onclick=async()=>{if(!db)return;$("loginStatus").textContent="로그인 중...";const {error}=await db.auth.signInWithPassword({email:$("email").value,password:$("password").value});$("loginStatus").textContent=error?"로그인에 실패했어요. 교사 계정을 확인하세요.":"";if(!error)showList();};
$("logout").onclick=async()=>{await db.auth.signOut();$("listPanel").classList.add("hidden");$("loginPanel").classList.remove("hidden");};
$("refresh").onclick=load;$("search").addEventListener("input",render);
async function showList(){$("loginPanel").classList.add("hidden");$("listPanel").classList.remove("hidden");await load();}
async function load(){
  $("listStatus").textContent="불러오는 중...";
  const {data,error}=await db.from("submissions").select("id,student_name,image_path,reply,created_at").order("created_at",{ascending:false}).limit(500);
  if(error){$("listStatus").textContent="목록을 불러오지 못했어요. 데이터베이스 정책을 확인하세요.";return;}
  allRows=data||[];render();$("listStatus").textContent="";
}
async function render(){
  const q=$("search").value.trim().toLocaleLowerCase("ko");const rows=allRows.filter(r=>(r.student_name||"").toLocaleLowerCase("ko").includes(q));
  $("count").textContent=`전체 ${allRows.length}건 · 검색 결과 ${rows.length}건`;
  const host=$("submissions");host.replaceChildren();
  if(!rows.length){const empty=document.createElement("p");empty.className="hint";empty.textContent="아직 제출된 활동지가 없거나 검색 결과가 없습니다.";host.append(empty);return;}
  for(const item of rows){
    const {data:signed}=await db.storage.from(BUCKET).createSignedUrl(item.image_path,3600);
    const card=document.createElement("article");card.className="submission-card";
    const heading=document.createElement("h3");heading.textContent=`${item.student_name} · ${new Date(item.created_at).toLocaleString("ko-KR")}`;
    const img=document.createElement("img");img.src=signed?.signedUrl||"";img.alt="학생 활동지 사진";img.loading="lazy";
    const replyTitle=document.createElement("p");replyTitle.className="reply-label";replyTitle.textContent="세종대왕님의 답장";
    const reply=document.createElement("p");reply.className="reply-text";reply.textContent=item.reply||"답장 없음";
    card.append(heading,img,replyTitle,reply);host.append(card);
  }
}
(async()=>{if(db){const {data}=await db.auth.getSession();if(data.session)showList();}})();
