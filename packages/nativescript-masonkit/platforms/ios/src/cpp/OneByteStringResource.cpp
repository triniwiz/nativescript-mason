//
// Created by Osei Fortune on 30/09/2023.
//

#include "OneByteStringResource.h"

OneByteStringResource::OneByteStringResource(char *string) : string_(string),
                                                             length_(strlen(string)) {

}


OneByteStringResource::OneByteStringResource(std::string string) : stdString_(std::move(string)) {
    this->usingString = true;
}

OneByteStringResource::~OneByteStringResource() {
    if (usingString) {
        // noop
    } else {
      //  mason_util_destroy_string((char *) this->string_);
        this->string_ = nullptr;
        this->length_ = 0;
    }
}

const char *OneByteStringResource::data() const {
    return this->string_;
}

size_t OneByteStringResource::length() const {
    return this->length_;
}



