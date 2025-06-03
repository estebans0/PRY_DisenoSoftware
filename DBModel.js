db = db.getSiblingDB('test'); // Create/switch to your DB

db.createCollection("usuarios", {
    validator:{

        $jsonSchema: {
      bsonType: "object",
      required: [
        "name", "apellidos", "email", "password",
        "tipoUsuario", "titulo"
      ], properties:{
        _id: {
          bsonType: "objectId",
          description: "ID de usuario requerido"
        },
        name:{
          bsonType: "string",
          description: "Required name"
        },
        apellidos: {
          bsonType: "string",
          description: "Required last name"
        },
        email: {
          bsonType: "string",
          description: "Must be unique email and is required"
        },
        password: {
          bsonType: "string",
          description: "Required password"
        },
        tipoUsuario: {
          enum: ["ADMINISTRADOR", "USUARIO"],
          description: "Required user type"
        },
        Posicion: {
          bsonType: "string",
          description: "Titulo del usuario"
        },
        
      }
    }

}})

db.usuarios.createIndex( { "_id" : 1 }, { unique : true } )
db.usuarios.createIndex( { "email" : 1 }, { unique : true } )

db.createCollection("sesiones", {

    validator:{
        $jsonSchema: {
      bsonType: "object",
      required: [

      ], properties:{
        NumeroSession:{
          bsonType: "objectId",
          description: "ID de sesion requerido"
        },
        ModalidadSesion: {
          enum: ["Presencial", "Virtual"],
          description: "Modalidad de sesion requerida"
        },
        TipoSesion: {
          enum: ["Ordinaria", "Extraordinaria", "Urgente"],
          description: "Tipo de sesion requerida"
        },
        FechaSesion: {
          bsonType: "date",
          description: "Fecha de sesion requerida"
        },
        HoraInicio: {
          bsonType: "string",
          description: "Hora de inicio de sesion requerida"
        },
        description: {
          bsonType: "string",
          description: "Descripcion de sesion requerida"
        },
        Quorum: {
          enum: ["Pending", "Achieved", "Not Achieved"],
          description: "Quorum requerido para la sesion"
        },
        Status:{
          enum: ["Scheduled", "Completed", "Cancelled"],
          description: "Estado de la sesion requerida"
        },
        SessionAttendees: {
          bsonType: "array",
          minItems: 2,

          items: {
            Attendee: {bsonType: "objectId"},
            Asistio: {bsonType: "bool"}

          },
          description: "Lista de asistentes a la sesion"
        }
       
      }
    }
  
  
}})

db.sesiones.createIndex( { "NumeroSession" : 1 }, { unique : true } )



db.createCollection("sesionAgenda", {

    validator:{
        $jsonSchema: {
      bsonType: "object",
      required: [

      ], properties:{
        _id: {
          bsonType: "objectId",
          description: "ID de agenda requerido"
        },
        NumeroSession:{
          bsonType: "objectId",
          description: "ID de sesion requerido"
        },
         SessionAgenda:{
          bsonType: "array",
          maxItems: 20,
          minItems: 1,
          uniqueItems: true,
          items: {
            bsonType: "object",
            properties:{
              Orden: { bsonType: "int" },
              Titulo: { bsonType: "string" },
              Duration: { bsonType: "double" },
              Presenter: {bsonType: "objectId"},
              Notas: {bsonType: "string"},
              Pro: {bsonType: "int"},
              Against: {bsonType: "int"},
              EstimatedTime: {bsonType: "double"},
              Actions: {bsontype: "array",
                maxItems: 10,
                items: {
                  TipoAccion: {bsonType: "string"},
                  Descripcion: {bsonType: "string"}

                }
              },
              SupportingDocuments: {
                bsonType: "array",
                items: {
                  bsonType: "objectId"
                }
              }
            }
          }
        }


}}}})
db.sesionAgenda.createIndex( { "NumeroSession" : 1 }, { unique : true } )