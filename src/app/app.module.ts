import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { environment } from 'src/environments/environment';
import { AppComponent } from './app.component';
import { DashboardModule } from './pages/dashboard.module';
import { SharedComponentsModule } from './shared/component/shared-components.module';
import { SharedMaterialModule } from './shared/shared-material/shared-material.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    DashboardModule,
    SharedMaterialModule,
    SharedComponentsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
