// import { HttpRequest, HttpResponseInit, InvocationContext,} from '@azure/functions';

// const usuarios: any[] = [];

// export async function crearUsuario(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
//   try {
//     const body = await request.json();

//     usuarios.push(body);

//     context.log('Usuario recibido:', body);

//     return {
//       status: 201,
//       jsonBody: {
//         mensaje: 'Usuario creado correctamente',
//         usuario: body,
//         id: 1404,
//         estado: 'ACTIVO',
//         empresa: 'Kiosko',
//       },
//     };
//   } catch (error) {
//     context.log('Error al crear usuario:', error);

//     return {
//       status: 400,
//       jsonBody: {
//         mensaje: 'El body debe contener un JSON válido',
//       },
//     };
//   }
// }

// export async function listarUsuarios(
//   request: HttpRequest,
//   context: InvocationContext
// ): Promise<HttpResponseInit> {
//   context.log('Usuarios registrados:', usuarios);

//   return {
//     status: 200,
//     jsonBody: {
//       total: usuarios.length,
//       usuarios: usuarios,
//     },
//   };
// }