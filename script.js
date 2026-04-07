let url = window.location.origin + '/api'; // Use full absolute URL for reliability
console.log("Connecté à l'API via:", url);



// 1. Charger etudiants
function chargerEtudiants() {
    fetch(url + '/notes/moyennes')
    .then(function(reponse) { 
        if (!reponse.ok) throw new Error("Erreur serveur ! Statut: " + reponse.status);
        return reponse.json(); 
    })
    .catch(err => {
        alert("🚨 Erreur de chargement: " + err.message);
        console.error(err);
    })
    .then(function(etudiants) {
        if(!etudiants) return; // Stop si erreur


        let tableau = document.getElementById('table-etudiants');
        tableau.innerHTML = '';
        
        for(let i=0; i<etudiants.length; i++) {
            let e = etudiants[i];
            let html = "<tr>";
            html += "<td>#" + e.id + "</td>";
            html += "<td>" + e.nom + "</td>";
            html += "<td>" + e.prenom + "</td>";
            
            // Affichage de la moyenne directement (type carte/badge)
            let texteMoyenne = e.moyenne ? e.moyenne.toFixed(2) : "--";
            let classeMoyenne = e.moyenne >= 10 ? "badge-success" : (e.moyenne > 0 ? "badge-danger" : "badge-neutral");
            html += "<td><span class='badge " + classeMoyenne + "'>" + texteMoyenne + " / 20</span></td>";
            
            html += "<td><button class='btn-supprimer' onclick='supprimerEtudiant(" + e.id + ")'>❌<span class='hide-mobile'> Supprimer</span></button></td>";
            html += "</tr>";
            tableau.innerHTML += html;
        }
    });
}

// 2. Ajouter etudiant
function ajouterEtudiant(event) {
    event.preventDefault(); 
    
    let n = document.getElementById('ajout-nom').value;
    let p = document.getElementById('ajout-prenom').value;
    
    let objet = { nom: n, prenom: p };
    
    fetch(url + '/etudiants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objet)
    })
    .then(function(res) {
        if (!res.ok) throw new Error("Erreur lors de l'ajout");
        document.getElementById('form-ajout-etudiant').reset();
        chargerEtudiants(); 
        chargerSelectEtudiants();
        chargerClassement();
    })
    .catch(err => alert("⚠️ Erreur: " + err.message));

}

// 3. Supprimer etudiant
function supprimerEtudiant(id) {
    if(confirm("Etes-vous sur de supprimer cet étudiant ?")) {
        fetch(url + '/etudiants/' + id, { method: 'DELETE' })
        .then(function() {
            chargerEtudiants();
            chargerSelectEtudiants(); // Rafraichissement partout !
            chargerClassement();
            
            // Si jamais on l'avait sélectionné dans le menu, on efface ses notes de l'écran
            document.getElementById('liste-notes').innerHTML = `<p style="color: var(--text-muted); font-style: italic; margin: 0;">Veuillez d'abord sélectionner un étudiant pour voir ses notes.</p>`;
        });
    }
}

// 4. Charger la boite de selection pour les notes
function chargerSelectEtudiants() {
    fetch(url + '/etudiants')
    .then(function(rep) { 
        if (!rep.ok) throw new Error("Erreur de récupération des étudiants (" + rep.status + ")");
        return rep.json(); 
    })
    .catch(err => console.error("Erreur SELECT:", err))
    .then(function(etudiants) {
        if(!etudiants) return;

        let select = document.getElementById('select-etudiant-notes');
        
        // On sauvegarde le choix actuel pour ne pas le perdre lors du rafraichissement
        let choixActuel = select.value;
        
        select.innerHTML = '<option value="">-- Choisir un étudiant --</option>';
        for(let i=0; i<etudiants.length; i++) {
            let optionHtml = "<option value='" + etudiants[i].id + "'>" + etudiants[i].nom + " " + etudiants[i].prenom + "</option>";
            select.innerHTML += optionHtml;
        }
        
        // On remet la valeur sélectionnée si elle existe encore
        if(choixActuel) {
            select.value = choixActuel;
        }
    });
}

// 5. Afficher note d'un etudiant precis
function afficherNotes() {
    let id = document.getElementById('select-etudiant-notes').value;
    if(id == "") {
        document.getElementById('liste-notes').innerHTML = `<p style="color: var(--text-muted); font-style: italic; margin: 0;">Veuillez d'abord sélectionner un étudiant pour voir ses notes.</p>`;
        return;
    }
    
    fetch(url + '/etudiants/' + id + '/notes/moyenne')
    .then(function(rep) { return rep.json(); })
    .then(function(data) {
        
        let div = document.getElementById('liste-notes');
        div.innerHTML = "";
        
        if (data.notes.length === 0) {
            div.innerHTML = `<p style="color: var(--text-muted); font-style: italic; margin: 0;">Cet étudiant n'a pas encore de notes enregistrées.</p>`;
        } else {
            for(let i=0; i<data.notes.length; i++) {
                let note = data.notes[i];
                div.innerHTML += "<div class='note-item'><strong>" + note.matiere + "</strong> : <span style='color:green;'>" + note.valeur + " / 20</span> <button class='btn-supprimer' style='padding:4px 8px; margin-left:15px;' onclick='supprimerNote(" + id + ", " + note.id + ")'>❌</button></div>";
            }
        }
    });
}

// 6. Ajouter Note
function ajouterNote(event) {
    event.preventDefault();
    let id = document.getElementById('select-etudiant-notes').value;
    if(id == "") {
        alert("Attention: Choisissez d'abord un étudiant dans la liste déroulante avant d'ajouter une note.");
        return;
    }
    
    let objet = {
        matiere: document.getElementById('ajout-matiere').value,
        valeur: document.getElementById('ajout-valeur').value
    };
    
    fetch(url + '/etudiants/' + id + '/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objet)
    })
    .then(function() {
        document.getElementById('form-ajout-note').reset();
        afficherNotes(); // Actualiser notes locales
        chargerClassement(); // Actualiser le classement !
        chargerEtudiants(); // Mettre à jour la moyenne dans le tableau principal
    });
}

// 7. Supprimer note
function supprimerNote(idEtudiant, idNote) {
    if(confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) {
        fetch(url + '/etudiants/' + idEtudiant + '/notes/' + idNote, { method: 'DELETE' })
        .then(function() {
            afficherNotes();
            chargerClassement(); // Actualiser le classement !
            chargerEtudiants(); // Mettre à jour la moyenne dans le tableau principal
        });
    }
}

// 8. Classement
function chargerClassement() {
    fetch(url + '/classement')
    .then(function(rep) { 
        if (!rep.ok) return []; // Retourne vide si erreur
        return rep.json(); 
    })
    .then(function(classement) {

        let tableau = document.getElementById('table-classement');
        tableau.innerHTML = '';
        
        for(let i=0; i<classement.length; i++) {
            let e = classement[i];
            tableau.innerHTML += "<tr><td>" + (i+1) + "</td><td>" + e.nom + " " + e.prenom + "</td><td>" + e.moyenne.toFixed(2) + "</td></tr>";
        }
    });
}

window.onload = function() {
    // Au démarrage, on charge absolument tout !
    chargerEtudiants();
    chargerSelectEtudiants();
    chargerClassement();
};
