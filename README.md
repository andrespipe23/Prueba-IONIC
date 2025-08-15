<h1>Despliegue de la APP Taskify</h1>
<p>Este documento contiene las instrucciones detalladas para la instalación, configuración y despliegue del proyecto APP Taskify de gestión de tareas personales. Se asume que el despliegue se realizará en un entorno local de Windows, para desarrollo. Este proyecto se basa en una aplicación móvil híbrida en IONIC</p>

🛠 Requisitos Previos
<ul>
	<li>
		Node.js (recomendado LTS ≥ 18).
		<ol>
			<li>
				Descarga: Ir al sitio web oficial ttps://nodejs.org.
			</li>
			<li>
				Instalación: Ejecutar el instalador. Instalarlo en la raíz del disco C: para evitar problemas de permisos.
			</li>
			<li>
				Verificación: Una vez instalado, abrir una consola y ejecutar node -v, deberia mostrar la versión de node.
			</li>
		</ol>
	</li>
	<li>
		npm (gestor de paquetes de Node.js).
		<ol>
			<li>
				Generalmente se instala junto con Node.js.
			</li>
			<li>
				Verificación: Una vez instalado, abrir una consola y ejecutar npm -v, deberia mostrar la versión de npm.
			</li>
		</ol>
	</li>
	<li>
		Ionic CLI.
		<ol>
			<li>
				Instalar Ionic globalmente con el siguiente comando en consola: npm install -g @ionic/cli.
			</li>
		</ol>
	</li>
	<li>
 		Git: Sistema de control de versiones.
		<ol>
			<li>
				Verificación: git --version.
			</li>
		</ol>
	</li>
	<li>
 		Android Studio y SDK de Android.
		<ul>
			<li>
				Opcionalmente, para ejecutar en Android/iOS nativo, para compilar y generar la APK de la APP.
			</li>
		</ul>
	</li>
</ul>

📦 Instalación
Seguir estos pasos para obtener el proyecto en su máquina:
<ol>
	<li>
		Clonar el repositorio:
		Abra una terminal (CMD o Git Bash) y navegue al directorio de su preferencia. Luego, clone el repositorio con el siguiente comando:
        git clone https://github.com/andrespipe23/Prueba-IONIC.git.
	</li>
	<li>
		Instalar dependencias:
		Navegar al directorio del proyecto y ejecutar npm, esto descargará todos los paquetes necesarios para que Ionic y Angular funcionen correctamente.
		por ejemplo: cd c:/proyectos/Prueba-IONIC.
		npm install.
	</li>
</ol>

🚀 Ejecutar la Aplicación.
<ul>
	<li>
		Servidor de desarrollo (Web)
		<ul>
			<li>
				Para probar la aplicación en el navegador, ejecutar el siguiente comando: ionic serve.
			</li>
			<li>
				Se abrirá automáticamente en el navegador predeterminado.
			</li>
			<li>
				Cualquier cambio en el código se reflejará en tiempo real.
			</li>
		</ul>
	</li>	
<ul>
	<li>
		Android / iOS (Opcional).
		Si deseas ejecutar la aplicación en un dispositivo o emulador:
		<ol>
			<li>
				Agrega la plataforma deseada, digitando en la consola uno de estos dos comandos:
				ionic capacitor add android.
				ionic capacitor add ios.
			</li>
			<li>
				Ejecuta la aplicación en un emulador o dispositivo real, digitando en la consola los siguientes comandos:
				ionic build.
				npx cap sync.
				npx cap open android.
			</li>
			<li>
				Se iniciara Android Studio donde podrá lanzar la aplicación en un emulador o instalar la APP directamente en el celular.
			</li>
		</ol>
	</li>		
</ul>

🚀 Uso de la Aplicación.
<ol>
	<li>
		Al iniciar la Aplicación se debe inisiar sesión, la APP esta conectada a una API REST desarrollada en Laravel, dicho proyecto esta en el siguiente repositorio: https://github.com/andrespipe23/prueba_tecnica_php.git.
		Los datos de acceso son:
		Email: admin@email.com
		Contraseña: administrador
		Esta sesión dura 1 hora, al finalizarla la APP lo redireccionara de nuevo al login para realizar una nueva sesión.
	</li>
</ol>