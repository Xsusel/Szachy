# Instrukcja instalacji XsusBot Chess na serwerze VPS (Debian)

Poniżej znajduje się szczegółowa instrukcja instalacji i uruchomienia aplikacji szachowej z silnikiem Stockfish 17.1 na systemie Debian.

## 1. Wymagania wstępne

Zaloguj się na swój serwer VPS jako root lub użytkownik z uprawnieniami sudo.

Zaktualizuj system:
```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Instalacja zależności systemowych

Zainstaluj Python 3, pip oraz unzip/tar (jeśli nie ma):
```bash
sudo apt install -y python3 python3-pip python3-venv wget tar
```

## 3. Przygotowanie plików aplikacji

1. Utwórz folder na aplikację:
   ```bash
   mkdir -p /opt/xsusbot
   cd /opt/xsusbot
   ```

2. Prześlij pliki aplikacji (app.py, requirements.txt, folder static, folder templates) do tego katalogu (np. przez SFTP lub FileZilla).

3. Utwórz wirtualne środowisko Python (zalecane) i zainstaluj biblioteki:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install gunicorn  # Zalecane do produkcji
   ```

## 4. Instalacja silnika Stockfish 17.1

Aplikacja oczekuje pliku wykonywalnego o nazwie `stockfish_engine` w głównym katalogu aplikacji.

1. Pobierz Stockfish 17.1 (wersja AVX2 dla nowoczesnych procesorów):
   ```bash
   wget https://github.com/official-stockfish/Stockfish/releases/download/sf_17.1/stockfish-ubuntu-x86-64-avx2.tar
   ```
   *Uwaga: Jeśli masz starszy procesor, poszukaj wersji `sse41-popcnt` lub standardowej na stronie Stockfish.*

2. Rozpakuj archiwum:
   ```bash
   tar -xf stockfish-ubuntu-x86-64-avx2.tar
   ```

3. Przenieś plik binarny i zmień jego nazwę:
   *W archiwum zazwyczaj jest folder `stockfish`, a w nim plik binarny. Sprawdź strukturę `ls -F`.*
   ```bash
   # Przykład (ścieżka może się różnić w zależności od zawartości archiwum):
   mv stockfish/stockfish-ubuntu-x86-64-avx2 ./stockfish_engine

   # Jeśli folder stockfish/ nie powstał, a plik wypakował się bezpośrednio:
   # mv stockfish-ubuntu-x86-64-avx2 ./stockfish_engine
   ```

4. Nadaj uprawnienia do wykonywania:
   ```bash
   chmod +x stockfish_engine
   ```

5. Posprzątaj:
   ```bash
   rm stockfish-ubuntu-x86-64-avx2.tar
   rm -rf stockfish/
   ```

## 5. Próbne uruchomienie

Uruchom serwer testowo:
```bash
./venv/bin/python app.py
```
Powinieneś zobaczyć komunikat: `Engine initialized successfully`.
Wejdź w przeglądarce na `http://TWOJE_IP:5000`. Jeśli działa, zatrzymaj serwer (Ctrl+C).

## 6. Uruchomienie jako usługa (Systemd)

Aby aplikacja działała w tle i włączała się po restarcie serwera, utwórz usługę systemd.

1. Utwórz plik serwisu:
   ```bash
   sudo nano /etc/systemd/system/xsusbot.service
   ```

2. Wklej poniższą zawartość (dostosuj ścieżki jeśli instalowałeś gdzie indziej):

   ```ini
   [Unit]
   Description=XsusBot Chess Server
   After=network.target

   [Service]
   User=root
   Group=root
   WorkingDirectory=/opt/xsusbot
   Environment="PATH=/opt/xsusbot/venv/bin"
   ExecStart=/opt/xsusbot/venv/bin/gunicorn --workers 4 --bind 0.0.0.0:80 app:app
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   *Uwaga: Jeśli nie używasz `gunicorn`, zmień linię ExecStart na `/opt/xsusbot/venv/bin/python app.py` (ale gunicorn jest wydajniejszy).*

3. Zapisz plik (Ctrl+O, Enter) i wyjdź (Ctrl+X).

4. Przeładuj systemd i uruchom usługę:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start xsusbot
   sudo systemctl enable xsusbot
   ```

## 7. Konfiguracja Portu (Opcjonalnie)

Domyślnie aplikacja (przez gunicorn w powyższym konfigu) działa na porcie 80. Upewnij się, że nie koliduje to z innym serwerem WWW (np. Apache/Nginx). Jeśli chcesz inny port (np. 5000), zmień w `ExecStart`: `--bind 0.0.0.0:5000`.

Baw się dobrze z XsusBotem!
