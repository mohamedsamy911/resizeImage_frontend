import { Component } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ConnectionService } from './connection.service';
import { validationMessages, formErrors } from '../../validationMessages';
import { osmLevels, gmaps } from '../../zoomLevels';
import { HttpHeaders } from '@angular/common/http';

class ImageSnippet {
  pending: boolean = false;
  status: string = 'init';
  constructor(public src: string, public file: File) {}
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [],
})
export class AppComponent {
  title = 'resizeImage_frontend';
  selectedFile: ImageSnippet;
  constructor(
    public connectionService: ConnectionService,
    private fb: FormBuilder
  ) {}
  password: string = 'password';

  show: boolean = false;
  stylenamevalidation: boolean;
  geoserverpanelState = true;
  datapanelstate = false;
  layernames: any;
  stylenames: any;
  filterdOptions = [];
  loading: boolean;
  errormsg: boolean;
  nmessage: string;
  ymessage: string;
  loggedIn: boolean;
  imageSizeForm: FormGroup;
  geoserverLogin: FormGroup;

  ngOnInit() {
    this.imageSizeForm = this.fb.group({
      image: [null, [Validators.required, requiredFileType('png')]],
      imageSource: [null],
      layername: ['', Validators.required],
      category: ['', Validators.required],
      org: ['', Validators.required],
      lang: [
        '',
        Validators.compose([
          Validators.minLength(2),
          Validators.required,
          Validators.maxLength(2),
        ]),
      ],
      role: ['', Validators.required],
      stylename: ['', Validators.required],
      mapRefrence: ['', Validators.required],
      sizes: this.fb.array([this.addSizeFormgroup()]),
    });
    this.geoserverLogin = this.fb.group({
      url: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
    this.imageSizeForm.valueChanges.subscribe((data) => {
      this.logValidationErrors(this.imageSizeForm);
    });
    this.geoserverLogin.valueChanges.subscribe((data) => {
      this.logValidationErrors(this.geoserverLogin);
    });
  }

  //log validations Messages to the view template
  logValidationErrors(group: FormGroup = this.imageSizeForm) {
    Object.keys(group.controls).forEach((key: string) => {
      const abstractControl = group.get(key);
      if (abstractControl instanceof FormGroup) {
        this.logValidationErrors(abstractControl);
      } else {
        formErrors[key] = '';
        if (
          abstractControl &&
          !abstractControl.valid &&
          (abstractControl.touched || abstractControl.dirty)
        ) {
          const messages = validationMessages[key];
          for (const errorKey in abstractControl.errors) {
            if (errorKey) {
              formErrors[key] += messages[errorKey] + ' ';
            }
          }
          if (abstractControl instanceof FormArray) {
            for (const control of abstractControl.controls) {
              if (control instanceof FormGroup) {
                this.logValidationErrors(control);
              }
            }
          }
        }
      }
    });
  }
  //returns an array of the form errors
  formErrorsFn(): any {
    return formErrors;
  }
  osmlevels() {
    return osmLevels;
  }
  gmapslevels() {
    return gmaps;
  }

  //add new size formgroup
  addSizeFormgroup(): FormGroup {
    return this.fb.group({
      leveldropdown: [null],
      size: [null, Validators.required],
      min: [null, Validators.required],
      max: [null, Validators.required],
    });
  }
  //remove formgroup
  removeGroup(index: number): void {
    (<FormArray>this.imageSizeForm.get('sizes')).removeAt(index);
  }
  //pushs a new form group to the formarray
  addSize(): void {
    (<FormArray>this.imageSizeForm.get('sizes')).push(this.addSizeFormgroup());
  }
  //return an array of all the formcontrols in the form array sizes
  getControls() {
    return (this.imageSizeForm.get('sizes') as FormArray).controls;
  }

  //submit button
  onSubmitClick(): void {
    this.loading = true;
    //create headers and append values
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('org', this.imageSizeForm.get('org')?.value);
    headers = headers.append('role', this.imageSizeForm.get('role')?.value);
    headers = headers.append('lang', this.imageSizeForm.get('lang')?.value);
    //create formdata and append values
    let formData = new FormData();
    formData.append('url', this.geoserverLogin?.get('url')?.value);
    formData.append('user', this.geoserverLogin?.get('username')?.value);
    formData.append('pw', this.geoserverLogin?.get('password')?.value);
    formData.append('image', this.imageSizeForm?.get('imageSource')?.value);
    formData.append('category', this.imageSizeForm?.get('category')?.value);
    formData.append(
      'size',
      JSON.stringify(this.imageSizeForm.get('sizes')?.value)
    );
    formData.append(
      'layername',
      JSON.stringify(this.imageSizeForm.get('layername')?.value)
    );
    formData.append(
      'stylename',
      JSON.stringify(this.imageSizeForm.get('stylename')?.value)
    );
    //send data to server side
    this.connectionService.uploadImage(formData, headers).subscribe(
      (data) => {
        if (data) {
          this.ymessage = 'Style added'
          this.loggedIn = true;
        setTimeout(() => {
          this.loggedIn = false;
        }, 5000);
          this.loading = false;
          this.onSuccess(data);
        } else {
          this.onError();
        }
      },
      (err) => {
        this.nmessage = 'Failed to connect to server and add style'
        this.errormsg = true;
        setTimeout(() => {
          this.errormsg = false;
        }, 5000);
        this.loading = false;
        console.log(err);
      }
    );
  }
  getlayers() {
    this.loading = true;
    this.geoserverpanelState = true;
    let loginBody: object = {
      url: this.geoserverLogin?.get('url')?.value,
      user: this.geoserverLogin?.get('username')?.value,
      pw: this.geoserverLogin?.get('password')?.value,
    };
    // let loginformData = new FormData();
    // loginformData.append('url', this.geoserverLogin?.get('url')?.value);
    // loginformData.append('user', this.geoserverLogin?.get('username')?.value);
    // loginformData.append('pw', this.geoserverLogin?.get('password')?.value);
    this.connectionService.getlayers(loginBody).subscribe({
      next: (data) => {
        this.ymessage = 'Logged in successfully'
        this.loggedIn = true;
        setTimeout(() => {
          this.loggedIn = false;
        }, 5000);
        this.loading = false;
        this.geoserverpanelState = false;
        this.datapanelstate = true;
        this.layernames = data.Layers;
        this.stylenames = data.Styles;
      },
      error: (err) => {
        console.log(err);
        this.nmessage ='Faild to login please check username or password'
        this.errormsg = true;
        setTimeout(() => {
          this.errormsg = false;
        }, 5000);
        this.loading = false;
        this.geoserverpanelState = true;
        this.datapanelstate = false;
      },
    });
  }
  compareStylename() {
    let styles = this.stylenames;
    let input = this.imageSizeForm.get('stylename')?.value;

    for (let style of styles) {
      if (input.localeCompare(style.name) != 0) {
        this.stylenamevalidation = false;
        console.log(this.stylenamevalidation);
      } else {
        this.stylenamevalidation = true;
        console.log(this.stylenamevalidation);
        break;
      }
    }
  }

  private onSuccess(res: any) {
    this.selectedFile.pending = false;
    this.selectedFile.status = 'ok';
  }

  private onError() {
    this.selectedFile.pending = false;
    this.selectedFile.status = 'fail';
    this.selectedFile.src = '';
  }
  //upload file function called in the image input field
  processFile(imageInput: any) {
    const file: File = imageInput.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', (event: any) => {
      this.selectedFile = new ImageSnippet(event.target.result, file);
      this.imageSizeForm.patchValue({
        imageSource: file,
      });
    });
    reader.readAsDataURL(file);
  }
  filterUsers(): void {
    this.filterdOptions = this.layernames.filter((item: any) => {
      item.value
        .toLowerCase()
        .includes(this.imageSizeForm.get('layername')?.value.toLowerCase());
    });
    console.log(this.filterdOptions);
  }
  onClick() {
    if (this.password === 'password') {
      this.password = 'text';
      this.show = true;
    } else {
      this.password = 'password';
      this.show = false;
    }
  }
}
//Custom validation for image type
export function requiredFileType(type: string) {
  return function (control: FormControl) {
    const file = control.value;

    if (file) {
      const extension = file.split('.')[1].toLowerCase();
      if (type.toLowerCase() !== extension.toLowerCase()) {
        return {
          requiredFileType: true,
        };
      }

      return null;
    }

    return null;
  };
}
