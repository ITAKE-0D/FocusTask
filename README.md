# FocusTask — Projet DevOps / SysOps

Déploiement de l'application **FocusTask** (gestion de tâches, Node.js + Express + MongoDB) selon les pratiques DevOps : conteneurs Docker, intégration continue, Infrastructure as Code avec Ansible, staging Docker Compose, production Kubernetes sur 2 nœuds, mise à jour sans coupure, auto-scaling, monitoring et logs centralisés.

- Application d'origine : [GhisleneT/FocusTask](https://github.com/GhisleneT/FocusTask) (description complète dans [`docs/APPLICATION.md`](docs/APPLICATION.md))
- Image Docker : [`itakd/focustask`](https://hub.docker.com/r/itakd/focustask)
- Documentation d'architecture : [`docs/architecture.pdf`](docs/architecture.pdf)

---

## Architecture

Deux distributions WSL sur le même PC jouent les deux rôles du sujet : **Debian = poste DevOps**, **Kali = infrastructure SysOps**. Docker ne tourne que sur Kali (les deux WSL partagent la même adresse réseau).
cd ~/FocusTask
git switch develop && git pull
git switch -c feature/readme
cat > README.md <<'EOF'
# FocusTask — Projet DevOps / SysOps

Déploiement de l'application **FocusTask** (gestion de tâches, Node.js + Express + MongoDB) selon les pratiques DevOps : conteneurs Docker, intégration continue, Infrastructure as Code avec Ansible, staging Docker Compose, production Kubernetes sur 2 nœuds, mise à jour sans coupure, auto-scaling, monitoring et logs centralisés.

- Application d'origine : [GhisleneT/FocusTask](https://github.com/GhisleneT/FocusTask) (description complète dans [`docs/APPLICATION.md`](docs/APPLICATION.md))
- Image Docker : [`itakd/focustask`](https://hub.docker.com/r/itakd/focustask)
- Documentation d'architecture : [`docs/architecture.pdf`](docs/architecture.pdf)

---

## Architecture

Deux distributions WSL sur le même PC jouent les deux rôles du sujet : **Debian = poste DevOps**, **Kali = infrastructure SysOps**. Docker ne tourne que sur Kali (les deux WSL partagent la même adresse réseau).
             git push                         image

Debian (DevOps) ────────► GitHub Actions ─────────────► Docker Hub
code, Git, tests, analyse, audit, itakd/focustask
Ansible test, build │
│ │ pull
│ Ansible (SSH, port 2222) ▼
└──────────────────────────────────────► Kali (SysOps) — Docker
├─ Staging : Docker Compose
│ FocusTask + MongoDB → :8081
└─ Production : Kubernetes kind (2 nœuds)
FocusTask, 2 à 6 pods (HPA) → :8080
MongoDB (StatefulSet)
Prometheus, Grafana, Loki → :3030


| Environnement | Outil | Adresse |
| --- | --- | --- |
| Staging | Docker Compose (app + MongoDB) | http://localhost:8081 |
| Production | Kubernetes kind, 2 nœuds | http://localhost:8080 |
| Grafana | Dans le cluster Kubernetes | http://localhost:3030 |

---

## Structure du dépôt

backend/ application Node.js (API + interface web)
server.js + routes /health, /ready, /metrics et logs des requêtes
test/health.test.js test automatique
Dockerfile fabrication de l'image
.github/workflows/
pipeline.yml pipeline CI
deploy/
compose/docker-compose.yml staging
k8s/focustask.yaml.j2 production (MongoDB, Deployment, Service, auto-scaling)
infra/ansible/
inventory.ini machine cible (Kali)
vars.yml registry, version, secret
install.yml installe Docker, kind, kubectl, helm
cluster.yml crée le cluster Kubernetes 2 nœuds
deploy-staging.yml déploie le staging
deploy-prod.yml déploie une version en production
monitoring.yml installe Prometheus, Grafana, Loki
monitoring/
servicemonitor.yaml Prometheus lit /metrics de l'appli
golden-signals.json tableau de bord Grafana
docs/ documentation


---

## Ce qui a été ajouté à l'application

| Ajout | Rôle |
| --- | --- |
| Appels API en relatif (`/api`) | L'interface marche sur n'importe quel port |
| `/health` | Kubernetes vérifie que l'appli est vivante |
| `/ready` | Kubernetes n'envoie du trafic que si MongoDB répond |
| `/metrics` | Mesures pour Prometheus (requêtes, erreurs, durée) |
| Un log par requête (`level=INFO/ERROR`) | Logs exploitables dans Loki |
| Test automatique | Le pipeline refuse un code qui casse l'appli |
| Dockerfile | Image Node 20, dépendances de production seulement, utilisateur non-root |

La configuration passe uniquement par des variables d'environnement (`MONGO_URI`, `JWT_SECRET`, `PORT`).

---

## Pipeline CI/CD

| Événement | Ce que fait GitHub Actions | Ensuite |
| --- | --- | --- |
| Pull Request | Analyse du code, audit des dépendances, test | Fusion seulement si c'est vert |
| Fusion sur `develop` | + image `itakd/focustask:develop` | `ansible-playbook deploy-staging.yml` |
| Tag `vX.Y.Z` | + image `itakd/focustask:X.Y.Z` | `ansible-playbook deploy-prod.yml -e version=X.Y.Z` |

Secrets GitHub utilisés : variable `DOCKERHUB_USER`, secret `DOCKERHUB_TOKEN`.

---

## Stratégie Git

| Branche | Rôle |
| --- | --- |
| `feature/...` | Une tâche en cours, fusionnée dans `develop` par Pull Request |
| `develop` | Travail validé, déployé en staging |
| `main` + tag `vX.Y.Z` | Version livrée, déployée en production |

Commits au format `type: description` (`feat`, `fix`, `test`, `build`, `ci`, `infra`, `docs`).

| Version | Contenu |
| --- | --- |
| v0.1.0 | Application conteneurisée, pipeline, Ansible, staging |
| v0.2.0 | Production Kubernetes, zéro coupure, auto-scaling |
| v1.0.0 | Monitoring (Prometheus, Grafana) et logs (Loki) |

---

## Déployer

Prérequis : WSL avec Debian (poste DevOps : Git, Node.js, Ansible, GitHub CLI) et Kali (SSH sur le port 2222, systemd activé). Les valeurs à adapter sont dans `infra/ansible/vars.yml` et `infra/ansible/inventory.ini`.

Depuis Debian, dans `infra/ansible` :

```bash
ansible-playbook install.yml -K                    # Docker + outils Kubernetes sur Kali
ansible-playbook cluster.yml                        # cluster Kubernetes 2 nœuds
ansible-playbook deploy-staging.yml -K              # staging
ansible-playbook deploy-prod.yml -e version=1.0.0   # production
ansible-playbook monitoring.yml                     # Prometheus, Grafana, Loki
```

Retour à une version précédente : `ansible-playbook deploy-prod.yml -e version=0.2.0`.

---

## Démontrer que ça fonctionne

| Ce qu'on prouve | Commande | Résultat attendu |
| --- | --- | --- |
| Production en ligne | `curl http://localhost:8080/health` | `{"status":"ok","version":"1.0.0"}` |
| Staging en ligne | `curl http://localhost:8081/health` | `{"status":"ok","version":"develop"}` |
| 2 nœuds Kubernetes | `kubectl get nodes` | 2 lignes `Ready` |
| Pods répartis | `kubectl -n focustask get pods -o wide` | Pods sur les 2 nœuds |
| Auto-scaling actif | `kubectl -n focustask get hpa` | MINPODS 2, MAXPODS 6 |
| Pipeline vert | `gh run list --limit 5` | Que des ✓ |
| Infra reproductible | `kind delete cluster --name focustask` puis `ansible-playbook cluster.yml` | Cluster recréé à l'identique |

**Zéro coupure** — une sonde tourne pendant qu'on change de version :

```bash
# Kali
while true; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/health; sleep 0.3; done | tee ~/sonde.log
# Debian
ansible-playbook deploy-prod.yml -e version=0.2.0
ansible-playbook deploy-prod.yml -e version=1.0.0
# Kali, après Ctrl+C : uniquement des 200
sort ~/sonde.log | uniq -c
```

**Auto-scaling** — des connexions en boucle font monter le CPU (chiffrement bcrypt) :

```bash
curl -s -H "Content-Type: application/json" -d '{"username":"demo","email":"demo@focus.fr","password":"demo1234"}' http://localhost:8080/api/auth/register
for i in 1 2 3; do
  kubectl -n focustask run charge-$i --image=curlimages/curl:8.10.1 --restart=Never --command -- \
    sh -c 'while true; do curl -s -o /dev/null -H "Content-Type: application/json" -d "{\"email\":\"demo@focus.fr\",\"password\":\"demo1234\"}" http://focustask:3000/api/auth/login; done'
done
kubectl -n focustask get hpa focustask -w          # REPLICAS passe de 2 à 6
kubectl -n focustask delete pod charge-1 charge-2 charge-3
```

**Supervision** — Grafana (http://localhost:3030), tableau de bord *FocusTask - golden signals* : latence, trafic, erreurs, saturation, nombre de pods. Logs : Explore > Loki > `{namespace="focustask"}`.

---

## Limites et améliorations possibles

- MongoDB sur un seul pod (pas de haute disponibilité de la base).
- Déploiement semi-automatique depuis Debian ; amélioration : runner GitHub auto-hébergé ou ArgoCD.
- Secret JWT à chiffrer avec `ansible-vault`.
- Déploiement canary possible avec Flagger.
