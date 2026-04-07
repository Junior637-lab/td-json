import express, { json } from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';


const app = express();
app.use(cors());
app.use(json()); // au lieu de body-parser
app.use(express.static('.')); // Serves index.html, style.css, script.js

const fichierDonnees = './data.json';

// Initialise le fichier si il n'existe pas (Utile pour Render)
if (!existsSync(fichierDonnees)) {
    writeFileSync(fichierDonnees, JSON.stringify({ etudiants: [] }, null, 2));
}


// Lit le fichier json
function lireFichier() {
    let donnees = readFileSync(fichierDonnees, 'utf8');
    return JSON.parse(donnees);
}

// Ecrit dans le fichier json
function ecrireFichier(data) {
    writeFileSync(fichierDonnees, JSON.stringify(data, null, 2));
}

// 1. Ajouter Etudiant
app.post('/api/etudiants', function(req, res) {
    let data = lireFichier();
    let nouvelEtudiant = {
        id: Math.floor(Math.random() * 10000), // id au hasard
        nom: req.body.nom,
        prenom: req.body.prenom,
        notes: []
    };
    data.etudiants.push(nouvelEtudiant);
    ecrireFichier(data);
    res.json(nouvelEtudiant);
});

// 2. Supprimer Etudiant
app.delete('/api/etudiants/:id', function(req, res) {
    let data = lireFichier();
    let id_a_supprimer = parseInt(req.params.id);
    
    // on cherche et on supprime (sans utiliser de fonctions complexes)
    let nouvelleListe = [];
    for(let i = 0; i < data.etudiants.length; i++) {
        if(data.etudiants[i].id !== id_a_supprimer) {
            nouvelleListe.push(data.etudiants[i]);
        }
    }
    data.etudiants = nouvelleListe;
    ecrireFichier(data);
    res.json({ message: 'Etudiant supprimé' });
});

// 3. Liste Etudiant
app.get('/api/etudiants', function(req, res) {
    let data = lireFichier();
    res.json(data.etudiants);
});

// 4. Ajouter Note
app.post('/api/etudiants/:id/notes', function(req, res) {
    let data = lireFichier();
    let id_etudiant = parseInt(req.params.id);
    
    for(let i = 0; i < data.etudiants.length; i++) {
        if(data.etudiants[i].id === id_etudiant) {
            let nouvelleNote = {
                id: Math.floor(Math.random() * 10000),
                matiere: req.body.matiere,
                valeur: parseFloat(req.body.valeur)
            };
            data.etudiants[i].notes.push(nouvelleNote);
            ecrireFichier(data);
            return res.json(nouvelleNote);
        }
    }
    res.status(404).send("Etudiant introuvable");
});

// 5. Supprimer Note
app.delete('/api/etudiants/:id/notes/:note_id', function(req, res) {
    let data = lireFichier();
    let id_etudiant = parseInt(req.params.id);
    let id_note = parseInt(req.params.note_id);
    
    for(let i = 0; i < data.etudiants.length; i++) {
        if(data.etudiants[i].id === id_etudiant) {
            let notes_restantes = [];
            for(let j=0; j < data.etudiants[i].notes.length; j++) {
                if(data.etudiants[i].notes[j].id !== id_note) {
                    notes_restantes.push(data.etudiants[i].notes[j]);
                }
            }
            data.etudiants[i].notes = notes_restantes;
            ecrireFichier(data);
            return res.json({ message: "Note supprimée" });
        }
    }
    res.status(404).send("Etudiant introuvable");
});

// 6. Liste des notes (tous les etudiants)
app.get('/api/notes', function(req, res) {
    let data = lireFichier();
    let tout = [];
    for(let i = 0; i < data.etudiants.length; i++) {
        tout.push({
            etudiant: data.etudiants[i].nom + " " + data.etudiants[i].prenom,
            notes: data.etudiants[i].notes
        });
    }
    res.json(tout);
});

// 7. Liste des notes d'un étudiant
app.get('/api/etudiants/:id/notes', function(req, res) {
    let data = lireFichier();
    let id_etudiant = parseInt(req.params.id);
    
    for(let i = 0; i < data.etudiants.length; i++) {
        if(data.etudiants[i].id === id_etudiant) {
            return res.json(data.etudiants[i].notes);
        }
    }
    res.status(404).send("Etudiant introuvable");
});

// 8. Liste des notes avec moyennes
app.get('/api/notes/moyennes', function(req, res) {
    let data = lireFichier();
    let resultat = [];
    
    for(let i = 0; i < data.etudiants.length; i++) {
        let e = data.etudiants[i];
        let somme = 0;
        for(let j=0; j < e.notes.length; j++) {
            somme = somme + e.notes[j].valeur;
        }
        let moy = 0;
        if(e.notes.length > 0) {
            moy = somme / e.notes.length;
        }
        
        resultat.push({
            id: e.id,
            nom: e.nom,
            prenom: e.prenom,
            notes: e.notes,
            moyenne: moy
        });
    }
    res.json(resultat);
});

// 9. Liste des notes avec moyenne d'un étudiant
app.get('/api/etudiants/:id/notes/moyenne', function(req, res) {
    let data = lireFichier();
    let id_etudiant = parseInt(req.params.id);
    
    for(let i = 0; i < data.etudiants.length; i++) {
        if(data.etudiants[i].id === id_etudiant) {
            let e = data.etudiants[i];
            let somme = 0;
            for(let j=0; j < e.notes.length; j++) {
                somme = somme + e.notes[j].valeur;
            }
            let moy = 0;
            if(e.notes.length > 0) {
                moy = somme / e.notes.length;
            }
            
            return res.json({
                notes: e.notes,
                moyenne: moy
            });
        }
    }
    res.status(404).send("Etudiant introuvable");
});

// 10. Classement des étudiants
app.get('/api/classement', function(req, res) {
    let data = lireFichier();
    let listTemp = [];
    
    // d'abord on calcule les moyennes
    for(let i = 0; i < data.etudiants.length; i++) {
        let e = data.etudiants[i];
        let somme = 0;
        for(let j=0; j < e.notes.length; j++) {
            somme += e.notes[j].valeur;
        }
        let moy = 0;
        if(e.notes.length > 0) moy = somme / e.notes.length;
        
        listTemp.push({
            id: e.id,
            nom: e.nom,
            prenom: e.prenom,
            moyenne: moy
        });
    }
    
    // tri par ordre de merite (tri à bulles classique)
    for(let i = 0; i < listTemp.length; i++) {
        for(let j = i + 1; j < listTemp.length; j++) {
            if(listTemp[j].moyenne > listTemp[i].moyenne) {
                let temp = listTemp[i];
                listTemp[i] = listTemp[j];
                listTemp[j] = temp;
            }
        }
    }
    
    res.json(listTemp);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serveur démarré !`);
    console.log(`🏠 Local: http://localhost:${PORT}`);
    console.log(`🌐 Port Render: ${process.env.PORT || '3000'}`);
});

