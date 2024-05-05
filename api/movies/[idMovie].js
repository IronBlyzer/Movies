// Fichier 'api/movies/[idMovie].js'

/*
 /!\ Chemin à adapter en fonction du nom de vos routes API
 Ici en mettant ce fichier dans '/pages/api/movies/[idMovie].js',
 nous déclarons la route '/api/movies/:idMovie',
 ce qui donnerait 'domain-name.com/api/movies/123456'
*/

/* Nous effectuons les imports des dépendances externes (node_modules ou fichiers internes) */
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

/*
 La fonction 'handler' est la fonction principale du 'endpoint API' (une sorte de porte d'entrée de notre API)
 Les mots clés 'export', 'default' et 'async' sont nécéssaires.
 La fonction 'handler' donne accès aux reférences de nos requête ('req') et réponse ('res') HTTP.
 Ces deux paramètres seront nécéssaires pour manipuler les données envoyées en requêtes
 et les données à insérer dans la réponse.
 */
export default async function handler(req, res) {

  // Depuis l'objet de requête 'req', nous récupérons un query-params HTTP via la clé 'query'.
  // L'objet 'req' se manipule ainsi, comme une données JSON classique.
  // Nous obtenons ici l'id du film passé en paramètre de l'URL lors de l'appel HTTP d'un client
  // La clé 'idMovie' correspond à la clé utilisée pour nommer le fichier déclarant ce endpoint.
  const idMovie = req.query.idMovie

  // Ici, ces deux instructions sont nécéssaires pour établir la connexion à la base de données.
  const client = await clientPromise;
  const db = client.db("sample_mflix");

  // Nous pouvons pré-déclarer des variables avant le switch-case.
  // Ici la variable 'dbMovie' va nous servir dans plusieurs cas du switch-case,
  // nous préférons donc la déclarer avant, qu'une seule fois, afin d'éviter la duplication de code inutile.
  let dbMovie = {};

  // Film temporaire pour tester, si besoin, la connexion à la BDD.
  let tmpMovie = {
    title: "Mon Titre",
    year: 1992
  }

  // Nous établissons plusieurs cas à exécuter conditionnellement en fonction du verbe HTTP utilisé pour l'appel
  // La 'method' d'appel est donc disponible dans l'objet de requête.
  switch (req.method) {

    // Appel du endpoint pour supprimer un film à partir de son id technique ('_id' généré par MongoDB).
    case "DELETE":
      try {
        // Supprimer le film correspondant à l'ID spécifié.
        const result = await db.collection("movies").deleteOne({ _id: new ObjectId(idMovie) });
    
        // Vérifier si un document a été supprimé avec succès.
        if (result.deletedCount === 1) {
          // Si un document a été supprimé avec succès, renvoyer une réponse 200 (No Content).
          res.status(200).end();
        } else {
          // Si aucun document n'a été trouvé avec l'ID spécifié, renvoyer une réponse 404 (Not Found).
          res.status(404).json({ status: 404, msg: "Movie not found" });
        }
      } catch (e) {
        // En cas d'erreur, renvoyer une réponse 500 (Internal Server Error).
        res.status(500).json({ status: 500, data: "SERVER ERROR" });
      }
      break;
    

    // Appel du endpoint pour modifier un film à partir de son id technique
    // et d'un objet passé en body-params de la requête (clé 'body').
    case "PUT":

      // Récupération de l'objet passé en paramètre.
      // Nous partons pour le moment du principe que cet objet ne contient que
      // des clés présentes dans la structure de base des objets de la BDD (collection 'movies').
      // Dans l'idéal, nous effectuerons un check de la structure envoyée avant de l'utiliser directement en base.
      const bodyParams = req.body;

      // Le try-catch permet brievement "d'attraper" si une erreur est "jetée" lors de l'accession à la BDD
      try {

        // Ici, nous récupérons dans une variable 'dbReturn' le retour de la base de données.
        // Nous utilisons la fonction 'updateOne' sur la collection 'movies' avec deux paramètres:
        // - Le premier paramètre est le filtre à appliquer, ici nous filtrons sur l'id technique
        //   de la ressource '_id' grâce à l'id des paramètres d'URL.
        // - Le deuxième est la modification à apporter, nous utilisons ici la fonctionnalité '$set' de MongoDB
        //   pour affecter le film uniquement sur les clés présentes dans l'objet body-params.
        //   En cours nous avons fait cet exemple avec juste 'title' et 'year' mais vous pouvez le prévoir pour tous les cas
        const dbReturn = await db.collection("movies").updateOne(
          { _id : new ObjectId(idMovie) },
          { $set: bodyParams }
        );

        // Nous renvoyons au client une réponse HTTP contenant le status et le retour de la base de données
        res.json({ status: 200, data: dbReturn });
      }
      catch (e) {
        // Si une erreur est trouvée, nous renvoyons une 400
        res.json({ status: 400, data: "SERVER ERROR" });
      }
    break;

    // Appel du endpoint pour ajouter un film à partir de son id technique
    // et d'un objet passé en body-params de la requête (clé 'body').
    case "POST":

      try {

        // L'ajout d'un film nécéssite que le client envoie de la données en body-params
        const bodyParams = req.body;

        // Accession à la BDD avec la fonction 'insertOne' de MongoDB et récupération du retour dans la variable 'dbReturn'
        const dbReturn = await db.collection("movies").insertOne( bodyParams );

        // Nous utilisons la variable 'dbMovie' pour aller chercher la ressource qui vient d'être ajouté
        // grâce à la clé 'insertedId' renvoyée par MongoDB
        dbMovie = await db.collection("movies").findOne({ _id : new ObjectId(dbReturn.insertedId)});

        // Nous envoyons finalement toute la ressource liées au nouveau film et non seulement l'id créé.
        res.json({ status: 200, data: dbMovie });
        break;

      }
      catch (e) {
        res.json({ status: 400, data: "SERVER ERROR" });
      };

      break;

    // Appel du endpoint pour récupérer les données d'une ressource liée à un film via son id technique ('_id')
    case "GET":

      try {

        // La variable dbMovie récupère le retour de l'accès à la BDD avec la fonction 'findOne' de MongoDB.
        // Cette fonction est appelée avec l'id technique du film passé en paramètre d'URL de la requête.
        dbMovie = await db.collection("movies").findOne({ _id : new ObjectId(idMovie) });
        // La BDD pour cette méthode renvoie toute la ressource du film, nous la renvoyons donc au client tel quel.
        res.json({ status: 200, data: {movie: dbMovie} });
        break;

      }
      catch (e) {
        res.json({ status: 400, data: "SERVER ERROR" });
      };

    // Cas par défaut, si aucun des verbes précédents n'a matché
    default:
      res.json({ status: 400, msg: "HTTP METHOD NOT FOUND" });
      break;

  // Fin du switch-case
  }
// Fin de la fontion 'handler'
}
