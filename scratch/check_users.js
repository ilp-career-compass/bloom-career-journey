import https from 'https';

const url = "https://vvnogvhdkkevfwcdlwsr.supabase.co/rest/v1/users";
const options = {
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bm9ndmhka2tldmZ3Y2Rsd3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NDI1MDIsImV4cCI6MjA5NDQxODUwMn0.SczxSeHMyVK3Srobb7PsLZOK2vRzvmLZhn_ScW09DP0",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bm9ndmhka2tldmZ3Y2Rsd3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NDI1MDIsImV4cCI6MjA5NDQxODUwMn0.SczxSeHMyVK3Srobb7PsLZOK2vRzvmLZhn_ScW09DP0",
  }
};

https.get(url, options, (res) => {
  console.log("Status:", res.statusCode);
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log("Response:", body.slice(0, 1500));
  });
}).on('error', (e) => {
  console.error("Error:", e);
});
