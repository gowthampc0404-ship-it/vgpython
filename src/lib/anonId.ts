export function getAnonId(): string {
  const key = "pylearn_anon_id";
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = "User_" + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "User_0000";
  }
}

export const DAILY_AI_LIMIT = 50;
