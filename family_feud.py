#!/usr/bin/env python3
# family_feud.py  -- versão terminal simples

import random
import unicodedata

# Base de perguntas: "pergunta": [(resposta, pontos), ...]
QUESTIONS = fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    console.log("Perguntas:", data);
  });

def normalize(s: str) -> str:
    s = s.strip().casefold()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")  # remove acentos
    return s

def play_round(question, answers):
    revealed = [False] * len(answers)
    strikes = 0
    round_score = 0

    print("\nPergunta:", question)
    # mostrar esquema de respostas (branco)
    def print_board():
        print("\nRespostas:")
        for i, (ans, pts) in enumerate(answers):
            if revealed[i]:
                print(f" {i+1}. {ans} — {pts} pts")
            else:
                print(f" {i+1}. {'[----]':6}")
    print_board()

    current_team = 0  # 0 = Time A (inicia), 1 = Time B
    teams = ["A", "B"]

    while not all(revealed) and strikes < 3:
        print(f"\nVez do Time {teams[current_team]}. (escreva 'passar' para passar, 'sair' para terminar o jogo)")
        guess = input("Pode fazer una tentativa: ").strip()
        if guess.lower() == "sair":
            print("Jogo terminado.")
            exit(0)
        if guess.lower() == "passar":
            current_team = 1 - current_team
            print(f"Passou para o Time {teams[current_team]}.")
            continue

        n_guess = normalize(guess)
        matched = False
        for i, (ans, pts) in enumerate(answers):
            if not revealed[i] and normalize(ans) == n_guess:
                revealed[i] = True
                round_score += pts
                matched = True
                print(f"Acertou! '{ans}' — {pts} pts.")
                print_board()
                break
        if not matched:
            strikes += 1
            print(f"Errado! Strike {strikes}/3.")
            if strikes >= 3:
                break
            # se errou, muda a vez (opcional segundo formato do jogo)
            current_team = 1 - current_team

    # se 3 strikes — oportunidade de roubo para time adversário
    if strikes >= 3:
        stealing_team = 1 - current_team
        print(f"\nTrês strikes! Time {teams[stealing_team]} pode tentar roubar.")
        steal_guess = input("Time roubando — d uma resposta: ").strip()
        if normalize(steal_guess) in [normalize(a) for (a, _) in answers if not revealed[answers.index((a, _))]]:
            # encontrar e somar pontos não-revelados (a versão original soma todos os pontos que estavam revelados)
            # Aqui aplicamos regra: se o ladrão acertar, leva os pontos acumulados na rodada
            print("Roubo bem-sucedido! Time roubou os pontos da ronda.")
            return stealing_team, round_score
        else:
            print("Roubo falhou. Time original mantém os pontos da ronda.")
            # time que estava jogando antes dos strikes ganha
            owner_team = current_team
            return owner_team, round_score
    else:
        # nenhuma strike e esgotou respostas -> time que estava na vez ganha os pontos
        # (na versão real, o time que estava em controle ao final fica com os pontos)
        owner_team = current_team
        print("\nTodas as respostas foram reveladas ou a ronda acabou.")
        return owner_team, round_score

def main():
    print("=== FAMILY FEUD (terminal) ===")
    scores = [0, 0]  # A, B
    rounds = 3
    question_pool = list(QUESTIONS.items())
    random.shuffle(question_pool)

    for r in range(min(rounds, len(question_pool))):
        q, answers = question_pool[r]
        # shuffle answers order (opcional)
        indexed_answers = list(answers)
        random.shuffle(indexed_answers)

        winner_team, pts = play_round(q, indexed_answers)
        scores[winner_team] += pts
        print(f"\nTime {'A' if winner_team==0 else 'B'} ganhou {pts} pontos nesta ronda.")
        print(f"PLACAR: Time A = {scores[0]} | Time B = {scores[1]}")
        input("\nPressione Enter para próxima ronda...")

    print("\nFIM DO JOGO!")
    print(f"Placar final: Time A = {scores[0]} | Time B = {scores[1]}")
    if scores[0] > scores[1]:
        print("Time A venceu!")
    elif scores[1] > scores[0]:
        print("Time B venceu!")
    else:
        print("Empate!")

if __name__ == "__main__":
    main()
