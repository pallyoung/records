import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { authActions } from "../../store/authStore";
import { hashPassword } from "../../utils/crypto";
import styles from "./LoginForm.module.scss";

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
}

export default function LoginForm() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginData, setLoginData] = useState<LoginData>({
    username: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState<RegisterData>({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleTabChange = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { username, password } = loginData;

    // 验证
    if (!username || !password) {
      setError("请填写完整信息");
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = authActions.verifyUser(username, passwordHash);

    if (user) {
      // 登录成功
      authActions.login({
        userId: user.userId,
        username: user.username,
      });
      // 清空表单
      setLoginData({ username: "", password: "" });
    } else {
      setError("用户名或密码错误");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { username, password, confirmPassword } = registerData;

    // 验证用户名长度
    if (username.length < 4 || username.length > 20) {
      setError("用户名需要 4-20 位字母数字");
      return;
    }

    // 验证用户名格式
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setError("用户名只能包含字母和数字");
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      setError("密码至少需要 6 位");
      return;
    }

    // 验证确认密码
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    // 检查用户名是否已存在
    if (authActions.isUsernameTaken(username)) {
      setError("用户名已存在");
      return;
    }

    // 创建用户
    const newUser = {
      userId: uuidv4(),
      username,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    authActions.register(newUser);

    // 注册成功，显示成功信息并切换到登录
    setSuccess("注册成功！请登录");
    setRegisterData({ username: "", password: "", confirmPassword: "" });

    // 1.5秒后自动切换到登录标签
    setTimeout(() => {
      handleTabChange("login");
    }, 1500);
  };

  const handleLoginInputChange = (field: keyof LoginData, value: string) => {
    setLoginData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegisterInputChange = (
    field: keyof RegisterData,
    value: string,
  ) => {
    setRegisterData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" />
            </svg>
          </div>
          <h1 className={styles.logoTitle}>生活记录</h1>
        </div>

        {/* Card */}
        <div className={styles.card}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "login" ? styles.tabActive : ""}`}
              onClick={() => handleTabChange("login")}
            >
              登录
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "register" ? styles.tabActive : ""}`}
              onClick={() => handleTabChange("register")}
            >
              注册
            </button>
          </div>

          {/* 登录表单 */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin}>
              {error && <div className={styles.errorMsg}>{error}</div>}

              <div className={styles.formGroup}>
                <label htmlFor="login-username" className={styles.label}>
                  用户名
                </label>
                <input
                  id="login-username"
                  type="text"
                  className={styles.input}
                  placeholder="请输入用户名"
                  value={loginData.username}
                  onChange={(e) =>
                    handleLoginInputChange("username", e.target.value)
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="login-password" className={styles.label}>
                  密码
                </label>
                <input
                  id="login-password"
                  type="password"
                  className={styles.input}
                  placeholder="请输入密码"
                  value={loginData.password}
                  onChange={(e) =>
                    handleLoginInputChange("password", e.target.value)
                  }
                />
              </div>

              <button
                type="submit"
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                登录
              </button>
            </form>
          )}

          {/* 注册表单 */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister}>
              {error && <div className={styles.errorMsg}>{error}</div>}
              {success && <div className={styles.successMsg}>{success}</div>}

              <div className={styles.formGroup}>
                <label htmlFor="register-username" className={styles.label}>
                  用户名
                </label>
                <input
                  id="register-username"
                  type="text"
                  className={styles.input}
                  placeholder="4-20位字母数字"
                  value={registerData.username}
                  onChange={(e) =>
                    handleRegisterInputChange("username", e.target.value)
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="register-password" className={styles.label}>
                  密码
                </label>
                <input
                  id="register-password"
                  type="password"
                  className={styles.input}
                  placeholder="至少6位"
                  value={registerData.password}
                  onChange={(e) =>
                    handleRegisterInputChange("password", e.target.value)
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label
                  htmlFor="register-confirm-password"
                  className={styles.label}
                >
                  确认密码
                </label>
                <input
                  id="register-confirm-password"
                  type="password"
                  className={styles.input}
                  placeholder="再次输入密码"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    handleRegisterInputChange("confirmPassword", e.target.value)
                  }
                />
              </div>

              <button
                type="submit"
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                注册
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
