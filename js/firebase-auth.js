
console.log("🔥 SCRIPT FUNCIONANDO");
// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB5vkqROXI0dTtykIGIs34bIvwrKpCICLQ",
  authDomain: "plantaosalvo.firebaseapp.com",
  databaseURL: "https://plantaosalvo-default-rtdb.firebaseio.com",
  projectId: "plantaosalvo",
  storageBucket: "plantaosalvo.appspot.com",
  messagingSenderId: "220085645535",
  appId: "1:220085645535:web:b8d58614850065fad4b96a"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.getElementById("btn-login");
  const btnCadastro = document.getElementById("btn-cadastro");
  const formLogin = document.getElementById("form-login");
  const formCadastro = document.getElementById("form-cadastro");

  btnLogin.addEventListener("click", () => {
    formLogin.classList.remove("d-none");
    formCadastro.classList.add("d-none");
    btnLogin.classList.add("active");
    btnCadastro.classList.remove("active");
  });

  btnCadastro.addEventListener("click", () => {
    formLogin.classList.add("d-none");
    formCadastro.classList.remove("d-none");
    btnLogin.classList.remove("active");
    btnCadastro.classList.add("active");
  });

  // Login
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-usuario").value;
    const senha = document.getElementById("login-senha").value;

    try {
      const cred = await auth.signInWithEmailAndPassword(email, senha);
      const user = cred.user;
      localStorage.setItem("plantaoMedicoAuth", JSON.stringify({ uid: user.uid, username: user.email }));
      alert("Login realizado com sucesso!");
      window.location.href = "index.html";
    } catch (err) {
      alert("Erro no login: " + err.message);
    }
  });

  // Cadastro
  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("novo-usuario").value;
    const senha = document.getElementById("nova-senha").value;
    const confirmar = document.getElementById("confirmar-senha").value;

    if (senha !== confirmar) {
      alert("As senhas não coincidem.");
      return;
    }

    try {
      await auth.createUserWithEmailAndPassword(email, senha);
      alert("Conta criada com sucesso!");
      btnLogin.click(); // volta para login
    } catch (err) {
      alert("Erro ao criar conta: " + err.message);
    }
  });
});
