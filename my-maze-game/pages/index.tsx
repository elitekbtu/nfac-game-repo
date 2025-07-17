import Link from "next/link";

export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 40 }}>
      <h1>Добро пожаловать в лабиринт Satbayev University!</h1>
      <p>Нажмите, чтобы начать игру:</p>
      <Link href="/game">
        <button style={{ fontSize: 20, padding: "10px 30px" }}>Начать игру</button>
      </Link>
    </main>
  );
} 