# FocusTask

## Présentation

FocusTask est une application web full-stack développée en JavaScript (Node.js + Express + MongoDB) permettant de gérer ses tâches personnelles tout en aidant les personnes sujettes aux distractions grâce à un système de relance par notifications.

Chaque utilisateur possède son propre compte et ne peut accéder qu'à ses propres données.

---

# Fonctionnalités

## Authentification

* Création d'un compte
* Connexion
* Déconnexion
* Mots de passe sécurisés avec bcrypt
* Authentification par JWT
* Isolation complète des données entre utilisateurs

---

## Gestion des tâches

Chaque tâche possède :

* un titre
* une description
* une deadline
* une priorité (Basse, Moyenne, Haute)
* une catégorie
* un statut (À faire, En cours, Terminée)

Fonctionnalités :

* création
* affichage
* suppression
* changement de statut
* tri par deadline
* filtrage par catégorie
* filtrage par priorité
* filtrage par statut

---

## Catégories

Chaque utilisateur peut :

* créer ses propres catégories
* les utiliser lors de la création d'une tâche
* filtrer les tâches selon la catégorie choisie

---

## Mode Focus

Une tâche peut être lancée en mode Focus.

L'application affiche :

* la tâche en cours
* un chronomètre
* des notifications système à intervalle régulier (configurable)

L'utilisateur peut arrêter le mode Focus ou marquer la tâche comme terminée.

---

# Technologies utilisées

## Front-end

* HTML5
* JavaScript (Vanilla)

## Back-end

* Node.js
* Express

## Base de données

* MongoDB

## Sécurité

* bcrypt
* JWT
* Middleware d'authentification

---

# Installation

## 1. Installer les dépendances

Dans le dossier backend :

npm install

---

## 2. Créer le fichier .env

Créer un fichier .env contenant :

PORT=3000

MONGO_URI=votre_uri_mongodb

JWT_SECRET=votre_secret

---

## 3. Lancer MongoDB

Démarrer MongoDB.

---

## 4. Lancer le serveur

npm start

---

## 5. Ouvrir l'application

Ouvrir le navigateur sur :

http://localhost:3000

---

# Choix techniques

Le projet utilise :

* bcrypt pour protéger les mots de passe
* JWT pour sécuriser les utilisateurs connectés
* MongoDB pour conserver les données après redémarrage
* Express pour exposer une API REST

Chaque requête liée aux tâches ou aux catégories est protégée par un middleware JWT afin de garantir qu'un utilisateur ne puisse accéder qu'à ses propres informations.
