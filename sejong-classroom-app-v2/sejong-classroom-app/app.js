// Supabase Project URL과 anon public key를 입력하세요. 비밀키(service_role/OpenAI)는 절대 여기에 넣지 마세요.
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const BUCKET = "worksheets";
const $ = id => document.getElementById(id);
const configured = !SUPABASE_URL.includes("YOUR_") && !SUPABASE_ANON_KEY.includes("YOUR_");
const supabase = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let selectedFile = null;

function setStatus(message, isError=false) { $("status").textContent=message; $("status").style.color=isError?"#a22":"#80502c"; }
function updateButton(){ $("sendBtn").disabled=!(selectedFile && $("consent").checked); }
function chooseFile(file){
  if(!file) return;
  if(!file.type.startsWith("image/")){setStatus("JPG, PNG 등 사진 파일을 선택해 주세요.",true);return;}
  if(file.size>15*1024*1024){setStatus("원본 사진은 15MB 이하로 선택해 주세요.",true);return;}
  selectedFile=file; $("preview").src=URL.createObjectURL(file); $("previewWrap").classList.remove("hidden"); setStatus("사진이 준비됐어요. 이름(또는 번호)과 동의 여부를 확인해 주세요."); updateButton();
}
$("cameraInput").addEventListener("change",e=>chooseFile(e.target.files[0]));
$("fileInput").addEventListener("change",e=>chooseFile(e.target.files[0]));
$("consent").addEventListener("change",updateButton);
$("removeImage").addEventListener("click",()=>{selectedFile=null;$("cameraInput").value="";$("fileInput").value="";$("previewWrap").classList.add("hidden");$("preview").src="";setStatus("");updateButton();});

// 전송 전에 사진 크기를 줄여 모바일 네트워크와 AI 요청 용량을 절약합니다.
async function compressImage(file){
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas"); canvas.width=Math.round(bitmap.width*scale); canvas.height=Math.round(bitmap.height*scale);
  canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",0.84));
  if(!blob) throw new Error("사진을 변환하지 못했습니다.");
  return new File([blob],"worksheet.jpg",{type:"image/jpeg"});
}
function toBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]);r.onerror=reject;r.readAsDataURL(file);});}
$("sendBtn").addEventListener("click",async()=>{
  if(!configured){setStatus("아직 Supabase 연결 설정이 필요합니다. README의 1~3단계를 진행해 주세요.",true);return;}
  if(!selectedFile||!$("consent").checked)return;
  const studentName=$("studentName").value.trim().slice(0,20)||"이름 없음";
  $("sendBtn").disabled=true;setStatus("사진을 정리하고 세종대왕님께 전달하고 있어요...");
  try{
    const image=await compressImage(selectedFile); const base64=await toBase64(image);
    const path=`${Date.now()}-${crypto.randomUUID()}.jpg`;
    const {error:uploadError}=await supabase.storage.from(BUCKET).upload(path,image,{upsert:false,contentType:"image/jpeg"});
    if(uploadError)throw uploadError;
    const {data,error}=await supabase.functions.invoke("answer",{body:{imageBase64:base64,mimeType:"image/jpeg",studentName,imagePath:path}});
    if(error)throw error;
    if(!data?.reply)throw new Error("답장 내용이 없습니다.");
    $("replyText").textContent=data.reply;$("replyPanel").classList.remove("hidden");setStatus("답장이 도착했어요!");$("replyPanel").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(err){console.error(err);setStatus("전송 중 문제가 생겼어요. 인터넷 연결 또는 선생님 설정을 확인해 주세요.",true);}
  finally{updateButton();}
});
